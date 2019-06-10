/*
 * Library for storing and editing data.
 *
 */

// Dependencies.
const fs = require("fs");
const path = require("path");
const helpers = require('./helpers')

// Container for the moule (to be exported).
const lib = {};

// Base dorectpru pf the data folder.
lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to a file.
lib.create = (dir, file, data, cb) => {
    // Open the file for writing.
    fs.open(
        `${lib.baseDir}${dir}/${file}.json`,
        "wx",
        (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
                // Convert data to string.
                const stringData = JSON.stringify(data);
                // Write to file and close it.
                fs.writeFile(fileDescriptor, stringData, err => {
                    if (!err) {
                        fs.close(fileDescriptor, err => {
                            if (!err) {
                                cb(false);
                            } else {
                                cb("Error closing new file.");
                            }
                        });
                    } else {
                        cb("Error writing to new file.");
                    }
                });
            } else {
                cb("Could not create new file, it may already exist.");
            }
        }
    );
};

// Read data from a file.
lib.read = (dir, file, cb) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, "utf-8", (err, data) => {
        if (!err && data) {
            const parsedData = helpers.parseJsonToObject(data)
            cb(false, parsedData)
        } else {
            cb(err, data);
        }
    });
};

// Update data inside a file.
lib.update = (dir, file, data, cb) => {
    // Open the file for writing.
    fs.open(
        `${lib.baseDir}${dir}/${file}.json`,
        "r+",
        (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
                // Convert data to string.
                const stringData = JSON.stringify(data);
                // Truncate the file.
                fs.ftruncate(fileDescriptor, err => {
                    if (!err) {
                        fs.writeFile(fileDescriptor, stringData, err => {
                            if (!err) {
                                fs.close(fileDescriptor, err => {
                                    if (!err) {
                                        cb(false);
                                    } else {
                                        cb("Error closing the file.");
                                    }
                                });
                            } else {
                                cb("Error writing to existing file.");
                            }
                        });
                    } else {
                        cb("Error truncating file.");
                    }
                });
            } else {
                cb("Could not open the file for updating, it may not exist.");
            }
        }
    );
};

// Delete data file.
lib.delete = (dir, file, cb) => {
    // Unlink the file.
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, err => {
        if (!err) {
            cb(false);
        } else {
            cb("Error deleting file.");
        }
    });
};

// Export the module
module.exports = lib;
