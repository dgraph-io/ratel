// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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

import { executeAdminGql } from "lib/helpers";

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

const MUTATION_START_BACKUP = `
  mutation startBackup(
      $destination: String!,
      $accessKey: String,
      $secretKey: String,
      $sessionToken: String,
      $anonymous: Boolean,
      $forceFull: Boolean,
  ) {
    backup(input: {
      destination: $destination,
      accessKey: $accessKey,
      secretKey: $secretKey,
      sessionToken: $sessionToken,
      anonymous: $anonymous,
      forceFull: $forceFull,
    }) {
      response {
        message
        code
      }
    }
  }
`;

export function getBackupDestination({ destinationType, backupPath }) {
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

export async function callStartBackup(config) {
    const vars = {
        destination: getBackupDestination(config),
        forceFull: config.forceFull,
    };
    if (config.overrideCredentials) {
        const { accessKey, anonymous, secretKey, sessionToken } = config;
        Object.assign(vars, {
            accessKey,
            anonymous,
            secretKey,
            sessionToken,
        });
    }
    try {
        return await executeAdminGql(MUTATION_START_BACKUP, vars);
    } catch (err) {
        console.error("Backup Error:", err);
        alert(`Backup Error: ${err}`);
        throw err;
    }
}

export function getBackupSettings(config) {
    return [
        `${config.forceFull ? "full" : ""}`,
        `${
            config.overrideCredentials && config.destinationType !== "nfs"
                ? "with credentials"
                : ""
        }`,
        `${
            config.overrideCredentials &&
            config.destinationType !== "nfs" &&
            config.anonymous
                ? "public bucket"
                : ""
        }`,
    ].filter(val => !!val);
}
