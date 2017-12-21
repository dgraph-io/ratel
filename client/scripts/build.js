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
const url = require("url");
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
const useYarn = fs.existsSync(paths.yarnLockFile);

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
    process.exit(1);
}

function printHostingInstructions(
    appPackage,
    publicUrl,
    publicPath,
    buildFolder,
    useYarn,
) {
    const publicPathname = url.parse(publicPath).pathname;
    if (publicUrl && publicUrl.indexOf(".github.io/") !== -1) {
        // "publicUrl": "http://user.github.io/project"
        console.log(
            `The project was built assuming it is hosted at ${chalk.green(
                publicPathname,
            )}.`,
        );
        console.log(
            `You can control this with the ${chalk.green(
                "publicUrl",
            )} field in your ${chalk.cyan("package.json")}.`,
        );
        console.log();
        console.log(
            `The ${chalk.cyan("build")} folder is ready to be deployed.`,
        );
        console.log(`To publish it at ${chalk.green(publicUrl)}, run:`);
        // If script deploy has been added to package.json, skip the instructions
        if (typeof appPackage.scripts.deploy === "undefined") {
            console.log();
            if (useYarn) {
                console.log(`  ${chalk.cyan("yarn")} add --dev gh-pages`);
            } else {
                console.log(
                    `  ${chalk.cyan("npm")} install --save-dev gh-pages`,
                );
            }
            console.log();
            console.log(
                `Add the following script in your ${chalk.cyan(
                    "package.json",
                )}.`,
            );
            console.log();
            console.log(`    ${chalk.dim("// ...")}`);
            console.log(`    ${chalk.yellow('"scripts"')}: {`);
            console.log(`      ${chalk.dim("// ...")}`);
            console.log(
                `      ${chalk.yellow('"predeploy"')}: ${chalk.yellow(
                    '"npm run build",',
                )}`,
            );
            console.log(
                `      ${chalk.yellow('"deploy"')}: ${chalk.yellow(
                    '"gh-pages -d build"',
                )}`,
            );
            console.log("    }");
            console.log();
            console.log("Then run:");
        }
        console.log();
        console.log(`  ${chalk.cyan(useYarn ? "yarn" : "npm")} run deploy`);
        console.log();
    } else if (publicPath !== "/") {
        // "publicUrl": "http://mywebsite.com/project"
        console.log(
            `The project was built assuming it is hosted at ${chalk.green(
                publicPath,
            )}.`,
        );
        console.log(
            `You can control this with the ${chalk.green(
                "publicUrl",
            )} field in your ${chalk.cyan("package.json")}.`,
        );
        console.log();
        console.log(
            `The ${chalk.cyan("build")} folder is ready to be deployed.`,
        );
        console.log();
    } else {
        if (publicUrl) {
            // "publicUrl": "http://mywebsite.com"
            console.log(
                `The project was built assuming it is hosted at ${chalk.green(
                    publicUrl,
                )}.`,
            );
            console.log(
                `You can control this with the ${chalk.green(
                    "publicUrl",
                )} field in your ${chalk.cyan("package.json")}.`,
            );
            console.log();
        } else {
            // no publicUrl
            console.log(
                "The project was built assuming it is hosted at the server root.",
            );
            console.log(
                `To override this, specify the ${chalk.green(
                    "publicUrl",
                )} in your ${chalk.cyan("package.json")}.`,
            );
            console.log("For example, add this to build it for GitHub Pages:");
            console.log();
            console.log(
                `  ${chalk.green('"publicUrl"')} ${chalk.cyan(
                    ":",
                )} ${chalk.green(
                    '"http://myname.github.io/myapp"',
                )}${chalk.cyan(",")}`,
            );
            console.log();
        }
        console.log(
            `The ${chalk.cyan(buildFolder)} folder is ready to be deployed.`,
        );
        console.log("You may serve it with a static server.");
        console.log();
    }
}

// First, read the current file sizes in build directory.
// This lets us display how much they changed later.
measureFileSizesBeforeBuild(paths.appBuild)
    .then(previousFileSizes => {
        // Remove all content but keep the directory so that
        // if you're in it, you don't end up in Trash
        fs.emptyDirSync(paths.appBuild);
        // Merge with the public folder
        copyPublicFolder();
        // Start the webpack build
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

            const appPackage = require(paths.appPackageJson);
            const publicUrl = paths.publicUrl;
            const publicPath = config.output.publicPath;
            const buildFolder = path.relative(process.cwd(), paths.appBuild);
            printHostingInstructions(
                appPackage,
                publicUrl,
                publicPath,
                buildFolder,
                useYarn,
            );
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
