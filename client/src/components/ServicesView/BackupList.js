// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import ReactDataGrid from "react-data-grid";

const BackupList = ({ columns, data, onSelectBackupItem, onSort }) => (
    <ReactDataGrid
        columns={columns}
        rowGetter={i => data[i]}
        rowsCount={data.length}
        enableCellSelect={true}
        onRowClick={onSelectBackupItem}
        onGridSort={onSort}
    />
);
export default BackupList;
