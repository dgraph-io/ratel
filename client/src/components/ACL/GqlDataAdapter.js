/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeAdminGql, executeQuery } from 'lib/helpers'

export const STATE_LOADING = 0
export const STATE_SUCCESS = 1
export const STATE_ERROR = 2

export async function isGqlSupported() {
  try {
    await executeAdminGql('query { health { version } }')
    return true
  } catch (err) {
    if (err?.errors?.[0]?.message) {
      return true
    }
    console.error('Error while testing GraphQL support', err)
    return false
  }
}

// New ACL data adapter - reads and writes group permissions via /admin GraphQL
export default function GqlDataAdapter(
  setFetchState,
  setLastUpdated,
  setUsers,
  setGroups,
  setPredicates,
  setLoadingError,
) {
  const runQuery = async (query, variables) => {
    setFetchState(STATE_LOADING)

    let newIsError = false

    try {
      const res = await executeAdminGql(query, variables)
      setLastUpdated(new Date())
      return res
    } catch (e) {
      newIsError = true
      throw e
    } finally {
      setFetchState(newIsError ? STATE_ERROR : STATE_SUCCESS)
    }
  }

  const loadData = async () => {
    // Fetch chema without blocking this function.
    ;(async () => {
      try {
        const schema = await executeQuery('schema {}')
        setPredicates(schema?.data?.schema || [])
      } catch (err) {
        // Ignore predicates error.
      }
    })()

    let isError = false

    try {
      const { data } = await runQuery(`
              query {
                queryUser {
                  name
                  groups {
                    name
                  }
                }
                queryGroup {
                  name
                  users {
                    name
                  }
                  rules {
                    predicate
                    perm: permission
                  }
                }
              }`)
      const groups = {}
      data.queryGroup.forEach((g) => {
        groups[g.name] = {
          name: g.name,
          acl: g.rules,
          userCount: g.users.length,
        }
      })
      setGroups(groups)

      const users = {}
      data.queryUser.forEach((u) => {
        users[u.name] = {
          name: u.name,
          groups: u.groups.map((g) => groups[g.name]),
        }
      })
      setUsers(users)

      setLoadingError(undefined)
    } catch (err) {
      console.error('Error fetching ACL state', err)
      setLoadingError(JSON.stringify(err?.errors?.[0]))
      isError = true
    } finally {
      setFetchState(isError ? STATE_ERROR : STATE_SUCCESS)
    }
  }

  const changeUser = async (isAdd, user, group) =>
    await runQuery(
      `mutation($name: String!, $group: String!) {
              updateUser(input:{
                filter: {
                  name: { eq: $name }
                }
                ${isAdd ? 'set' : 'remove'}: {
                  groups: [{ name: $group }]
                }
              }) { user { name } }
            }`,
      { name: user.name, group: group.name },
    )

  const saveUser = async (isCreate, userUid, name, password) => {
    if (isCreate) {
      return await runQuery(
        `mutation($name: String!, $password: String!) {
                  addUser(input: [{
                    name: $name,
                    password: $password
                  }]) { user { name } }
                }`,
        { name, password },
      )
    } else {
      return await runQuery(
        `mutation($name: String!, $password: String!) {
                  updateUser(input:{
                    filter: {
                      name: { eq: $name }
                    }
                    set: {
                      password: $password
                    }
                  }) {
                    user { groups { name } }
                  }
                }`,
        { name, password },
      )
    }
  }

  const deleteUser = async (user) =>
    await runQuery(
      `mutation($name: String!) {
              deleteUser(filter: {name: {eq: $name } }) {
                msg
              }
            }`,
      { name: user.name },
    )

  const createGroup = async (name) =>
    await runQuery(
      `mutation($name: String!) {
              addGroup(input: [{ name: $name }]) { group { name } }
            }`,
      { name },
    )

  const deleteGroup = async (group) =>
    await runQuery(
      `mutation($name: String!) {
              deleteGroup(filter: { name: { eq: $name } }) {
                msg
              }
            }`,
      { name: group.name },
    )

  const saveGroupAcl = async (group, acl) =>
    await runQuery(
      `mutation($name: String!) {
              updateGroup(input: {
                filter: { name: { eq: $name } }
                set: {
                  rules: [
                    ${acl
                      .map(
                        (r) => `{
                              predicate: ${JSON.stringify(r.predicate)}
                              permission: ${r.perm}
                            }`,
                      )
                      .join('\n')}
                  ]
                }
              }) { group { name } }
            }`,
      { name: group.name },
    )

  return {
    createGroup,
    changeUser,
    deleteGroup,
    deleteUser,
    loadData,
    saveGroupAcl,
    saveUser,
  }
}
