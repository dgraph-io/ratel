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

// Do this as the first thing so that any code reading it knows the right env.
// babel-preset-react-app only accepts 3 values - "development", "test" and
// "production".
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "local";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
    throw err;
});

// Ensure environment variables are read.
require("../config/env");

const chalk = require("chalk");
const fs = require("fs-extra");
const webpack = require("webpack");
const config = require("../config/webpack.config.local");
const paths = require("../config/paths");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const printBuildError = require("react-dev-utils/printBuildError");

// Warn and crash if required files are missing.
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
    process.exit(1);
}

// Remove all content but keep the directory so that
// if you're in it, you don't end up in Trash.
fs.emptyDirSync(paths.appBuild);
// Merge with the public folder.
copyPublicFolder();

// Start the webpack build.
build().then(
    ({ stats, warnings }) => {
        if (warnings.length) {
            console.log(chalk.yellow("Compiled with warnings.\n"));
            console.log(warnings.join("\n\n"));
            console.log(
                "\nSearch for the " +
                    chalk.underline(chalk.yellow("keywords")) +
                    " to learn more about each warning.",
            );
            console.log(
                "To ignore, add " +
                    chalk.cyan("// eslint-disable-next-line") +
                    " to the line before.\n",
            );
        } else {
            console.log(chalk.green("Compiled successfully.\n"));
        }

        console.log();
        console.log(
            `The ${chalk.cyan("build")} folder is ready to be deployed.`,
        );
        console.log();

        console.log("You may serve it with a static server.");
        console.log();
    },
    err => {
        console.log(chalk.red("Failed to compile.\n"));
        printBuildError(err);
        process.exit(1);
    },
);

// Create the local build and print the deployment instructions.
function build() {
    console.log("Creating a local build...");

    let compiler = webpack(config);
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                return reject(err);
            }
            const messages = formatWebpackMessages(stats.toJson({}, true));
            if (messages.errors.length) {
                // Only keep the first error. Others are often indicative
                // of the same problem, but confuse the reader with noise.
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                return reject(new Error(messages.errors.join("\n\n")));
            }
            if (
                process.env.CI &&
                (typeof process.env.CI !== "string" ||
                    process.env.CI.toLowerCase() !== "false") &&
                messages.warnings.length
            ) {
                console.log(
                    chalk.yellow(
                        "\nTreating warnings as errors because process.env.CI = true.\n" +
                            "Most CI servers set it automatically.\n",
                    ),
                );
                return reject(new Error(messages.warnings.join("\n\n")));
            }
            return resolve({
                stats,
                warnings: messages.warnings,
            });
        });
    });
}

function copyPublicFolder() {
    fs.copySync(paths.appPublic, paths.appBuild, {
        dereference: true,
        filter: file => file !== paths.appHtml,
    });
}
