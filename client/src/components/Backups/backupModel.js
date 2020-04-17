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
        default:
            throw new Error("Unknown destinationType: " + destinationType);
    }
}

export function getBackupUrlParams({
    accessKey,
    anonymous,
    destinationType,
    forceFull,
    overrideCredentials,
    secretKey,
    sessionToken,
}) {
    const params = [];
    const addParam = (key, value) => params.push(`${key}=${value}`);
    forceFull && addParam("force_full", "true");
    if (overrideCredentials && destinationType !== "nfs") {
        if (anonymous) {
            addParam("anonymous", "true");
        } else {
            accessKey && addParam("access_key", accessKey);
            secretKey && addParam("secret_key", secretKey);
            sessionToken && addParam("session_token", sessionToken);
        }
    }
    if (!params.length) {
        return "";
    }
    return `?${params.join("&")}`;
}

export function getBackupUrl(url, config) {
    return `${url}admin/backup${getBackupUrlParams(config)}`;
}

export async function startBackup(url, config) {
    try {
        return await fetch(getBackupUrl(url, config), {
            method: "POST",
            body: getBackupPayload(config),
        });
    } catch (err) {
        alert(`Backup Error: ${err}`);
        throw err;
    }
}
