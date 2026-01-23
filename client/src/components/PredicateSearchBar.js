/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

export default function PredicateSearchBar({ predicates, onFilter }) {
  /*
   * Called when the search bar change event fires. Filters predicates and fires the 'filter' event.
   * @event - input change event
   */
  const handleChange = (event) => {
    const searchValue = event.target.value

    const filteredPredicates = predicates.filter((p) =>
      p.predicate.toLowerCase().includes(searchValue.toLowerCase()),
    )

    onFilter(filteredPredicates)
  }

  // Render
  return (
    <div className='w-100 px-2 pb-2'>
      <input
        className='form-control'
        placeholder='Search predicates by name...'
        onChange={handleChange}
      />
    </div>
  )
}
