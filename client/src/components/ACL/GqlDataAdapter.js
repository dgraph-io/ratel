// Copyright 2020 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { executeAdminGql, executeQuery } from "lib/helpers";

export const STATE_LOADING = 0;
export const STATE_SUCCESS = 1;
export const STATE_ERROR = 2;

export async function isGqlSupported(url) {
    try {
        await executeAdminGql(url.url, "query { health { version } }");
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// New ACL data adapter - reads and writes group permissions via /admin GraphQL
export default function GqlDataAdapter(
    url,
    [fetchState, setFetchState],
    [lastUpdated, setLastUpdated],
    [users, setUsers],
    [groups, setGroups],
    [predicates, setPredicates],
    [loadingError, setLoadingError],
) {
    const runQuery = async (query, variables) => {
        setFetchState(STATE_LOADING);

        let newIsError = false;

        try {
            const res = await executeAdminGql(url.url, query, variables);
            setLastUpdated(new Date());
            return res;
        } catch (e) {
            newIsError = true;
            throw e;
        } finally {
            setFetchState(newIsError ? STATE_ERROR : STATE_SUCCESS);
        }
    };

    const loadData = async () => {
        // Fetch chema without blocking this function.
        (async () => {
            try {
                const schema = await executeQuery(url.url, "schema {}");
                setPredicates(schema?.data?.schema || []);
            } catch (err) {
                // Ignore predicates error.
            }
        })();

        let isError = false;

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
              }`);
            const groups = {};
            data.queryGroup.forEach(g => {
                groups[g.name] = {
                    name: g.name,
                    acl: g.rules,
                    userCount: g.users.length,
                };
            });
            setGroups(groups);

            const users = {};
            data.queryUser.forEach(u => {
                users[u.name] = {
                    name: u.name,
                    groups: u.groups.map(g => groups[g.name]),
                };
            });
            setUsers(users);

            setLoadingError(undefined);
        } catch (err) {
            console.error(err);
            setLoadingError(JSON.stringify(err?.errors?.[0]));
            isError = true;
        } finally {
            setFetchState(isError ? STATE_ERROR : STATE_SUCCESS);
        }
    };

    const changeUser = async (isAdd, user, group) =>
        await runQuery(
            `mutation($name: String, $group: String) {
              updateUser(input:{
                filter: {
                  name: { eq: $name }
                }
                ${isAdd ? "set" : "remove"}: {
                  groups: [{ name: $group }]
                }
              }) { user { name } }
            }`,
            { name: user.name, group: group.name },
        );

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
            );
        } else {
            return await runQuery(
                `mutation($name: String, $password: String) {
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
            );
        }
    };

    const deleteUser = async user =>
        await runQuery(
            `mutation($name: String) {
              deleteUser(filter: {name: {eq: $name } }) {
                msg
              }
            }`,
            { name: user.name },
        );

    const createGroup = async name =>
        await runQuery(
            `mutation($name: String!) {
              addGroup(input: [{ name: $name }]) { group { name } }
            }`,
            { name },
        );

    const deleteGroup = async group =>
        await runQuery(
            `mutation($name: String!) {
              deleteGroup(filter: { name: { eq: $name } }) {
                msg
              }
            }`,
            { name: group.name },
        );

    const saveGroupAcl = async (group, acl) =>
        await runQuery(
            `mutation($name: String!) {
              updateGroup(input: {
                filter: { name: { eq: $name } }
                set: {
                  rules: [
                    ${acl
                        .map(
                            r => `{
                              predicate: ${JSON.stringify(r.predicate)}
                              permission: ${r.perm}
                            }`,
                        )
                        .join("\n")}
                  ]
                }
              }) { group { name } }
            }`,
            { name: group.name },
        );

    return {
        createGroup,
        changeUser,
        deleteGroup,
        deleteUser,
        loadData,
        saveGroupAcl,
        saveUser,
    };
}
