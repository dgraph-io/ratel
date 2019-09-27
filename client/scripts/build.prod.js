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
process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
    throw err;
});

// Ensure environment variables are read.
require("../config/env");

const path = require("path");
const chalk = require("chalk");
const fs = require("fs-extra");
const webpack = require("webpack");
const config = require("../config/webpack.config.prod");
const paths = require("../config/paths");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const FileSizeReporter = require("react-dev-utils/FileSizeReporter");
const printBuildError = require("react-dev-utils/printBuildError");

const measureFileSizesBeforeBuild =
    FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

// Warn and crash if required files are missing.
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
    process.exit(1);
}

// First, read the current file sizes in build directory.
// This lets us display how much they changed later.
measureFileSizesBeforeBuild(paths.appBuild)
    .then(previousFileSizes => {
        // Remove all content but keep the directory so that
        // if you're in it, you don't end up in Trash.
        fs.emptyDirSync(paths.appBuild);
        // Merge with the public folder.
        copyPublicFolder();
        // Start the webpack build.
        return build(previousFileSizes);
    })
    .then(
        ({ stats, previousFileSizes, warnings }) => {
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

            console.log("File sizes after gzip:\n");
            printFileSizesAfterBuild(
                stats,
                previousFileSizes,
                paths.appBuild,
                WARN_AFTER_BUNDLE_GZIP_SIZE,
                WARN_AFTER_CHUNK_GZIP_SIZE,
            );
            console.log();

            const cdnUrl = paths.cdnUrl;
            const cdnPath = config.output.publicPath;
            const buildFolder = path.relative(process.cwd(), paths.appBuild);

            if (cdnPath !== "/") {
                // "cdnUrl": "http://mywebsite.com/project"
                console.log(
                    `The project was built assuming it is hosted at ${chalk.green(
                        cdnPath,
                    )}.`,
                );
                console.log(
                    `You can control this with the ${chalk.green(
                        "cdnUrl",
                    )} field in your ${chalk.cyan("package.json")}.`,
                );
                console.log();
                console.log(
                    `The ${chalk.cyan(
                        "build",
                    )} folder is ready to be deployed.`,
                );
                console.log();
            } else {
                if (cdnUrl) {
                    // "cdnUrl": "http://mywebsite.com"
                    console.log(
                        `The project was built assuming it is hosted at ${chalk.green(
                            cdnUrl,
                        )}.`,
                    );
                    console.log(
                        `You can control this with the ${chalk.green(
                            "cdnUrl",
                        )} field in your ${chalk.cyan("package.json")}.`,
                    );
                    console.log();
                } else {
                    // no cdnUrl
                    console.log(
                        "The project was built assuming it is hosted at the server root.",
                    );
                    console.log(
                        `To override this, specify the ${chalk.green(
                            "cdnUrl",
                        )} in your ${chalk.cyan("package.json")}.`,
                    );
                    console.log();
                }
                console.log(
                    `The ${chalk.cyan(
                        buildFolder,
                    )} folder is ready to be deployed.`,
                );
                console.log("You may serve it with a static server.");
                console.log();
            }
        },
        err => {
            console.log(chalk.red("Failed to compile.\n"));
            printBuildError(err);
            process.exit(1);
        },
    );

// Create the production build and print the deployment instructions.
function build(previousFileSizes) {
    console.log("Creating an optimized production build...");

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
                previousFileSizes,
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
