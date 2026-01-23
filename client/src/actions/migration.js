/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export const MIGRATE_TO_SERVER_CONNECTION =
  'migration/MIGRATE_TO_SERVER_CONNECTION'

export const MIGRATE_TO_HAVE_ZERO_URL = 'migration/MIGRATE_TO_HAVE_ZERO_URL'

export function migrateToServerConnection() {
  return { type: MIGRATE_TO_SERVER_CONNECTION }
}

export function migrateToHaveZeroUrl() {
  return { type: MIGRATE_TO_HAVE_ZERO_URL }
}
