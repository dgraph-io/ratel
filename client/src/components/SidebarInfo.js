/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

export default function SidebarInfo() {
  return (
    <div className='sidebar-help'>
      <section>
        <h4>Dgraph Ratel</h4>

        <p>An interface to easily query and visualize your data</p>
        <ul className='list-unstyled'>
          <li>
            <a
              href='https://github.com/hypermodeinc/ratel'
              target='_blank'
              rel='noopener noreferrer'
            >
              <i className='fab fa-github link-icon' />
              Ratel on Github
            </a>
          </li>
        </ul>
        <ul className='list-unstyled'>
          <li>
            <a
              href='https://github.com/hypermodeinc/ratel/issues'
              target='_blank'
              rel='noopener noreferrer'
            >
              <i className='fas fa-bug link-icon' />
              File an issue
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h3>Dgraph</h3>

        <p>Fast, distributed graph database</p>

        <ul className='list-unstyled'>
          <li>
            <a
              href='https://docs.hypermode.com/dgraph'
              target='_blank'
              rel='noopener noreferrer'
            >
              <i className='fas fa-book link-icon' />
              Documentation
            </a>
          </li>
          <li>
            <a
              href='https://discuss.hypermode.com'
              target='_blank'
              rel='noopener noreferrer'
            >
              <i className='fab fa-discourse link-icon' />
              Discussion forum
            </a>
          </li>
          <li>
            <a
              href='https://github.com/hypermodeinc/dgraph'
              target='_blank'
              rel='noopener noreferrer'
            >
              <i className='fab fa-github link-icon' />
              Dgraph on GitHub
            </a>
          </li>
        </ul>
      </section>

      <p style={{ fontSize: '0.5em' }}>
        Built at {process.env.RATEL_BUILT_AT}
        <br />
        Commit: {process.env.RATEL_COMMIT_ID}
        <br />
        Commit Info: {process.env.RATEL_COMMIT_INFO}
        <br />
      </p>
    </div>
  )
}
