/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export const getSpace = (tablet) =>
  tablet ? tablet.space || tablet.onDiskBytes : null
