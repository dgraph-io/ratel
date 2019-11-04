// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
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

export const DEFAULT_BACKUP_CONFIG = {
    destinationType: "nfs",
    backupPath: "",
};

export const DISPLAY_STRINGS = {
    nfs: {
        name: "NFS or local folder",
        pathName: "Filesystem Path",
        placeholder: "/home/dgraph/backupfolder/",
    },
    aws: {
        name: "AWS S3 bucket",
        pathName: "S3 Bucket",
        placeholder: "s3.us-west-2.amazonaws.com/<bucketname>",
    },
    minio: {
        name: "Minio",
        pathName: "Minio Host and Bucket",
        placeholder: "127.0.0.1:9000/<bucketname>",
    },
};

export function getBackupPayload({ destinationType, backupPath }) {
    switch (destinationType) {
        case "aws":
            return `s3://${backupPath}`;
        case "minio":
            return `minio://${backupPath}`;
        case "nfs":
            return backupPath;
    }
}

export async function startBackup(url, backupConfig) {
    const payload = getBackupPayload(backupConfig);
    try {
        return await fetch(`${url}admin/backup`, {
            method: "POST",
            body: getBackupPayload(backupConfig),
        });
    } catch (err) {
        alert(`Backup Error: ${err}`);
        throw err;
    }
}
