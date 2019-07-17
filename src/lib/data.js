/*
 * Library for storing and editing data.
 *
 */

// Dependencies.
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the moule (to be exported).
const lib = {};

// Base dorectpru pf the data folder.
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file.
lib.create = (dir, file, data, callback) => {
    // Open the file for writing.
    fs.open(
        `${lib.baseDir}${dir}/${file}.json`,
        'wx',
        (fsOpenError, fileDescriptor) => {
            if (!fsOpenError && fileDescriptor) {
                // Convert data to string.
                const stringData = JSON.stringify(data);
                // Write to file and close it.
                fs.writeFile(fileDescriptor, stringData, (fsWriteError) => {
                    if (!fsWriteError) {
                        fs.close(fileDescriptor, (fsCloseError) => {
                            if (!fsCloseError) {
                                callback(false);
                            } else {
                                callback('Error closing new file.');
                            }
                        });
                    } else {
                        callback('Error writing to new file.');
                    }
                });
            } else {
                callback('Could not create new file, it may already exist.');
            }
        },
    );
};

// Read data from a file.
lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf-8', (err, data) => {
        if (!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};

// Update data inside a file.
lib.update = (dir, file, data, callback) => {
    // Open the file for writing.
    fs.open(
        `${lib.baseDir}${dir}/${file}.json`,
        'r+',
        (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
                // Convert data to string.
                const stringData = JSON.stringify(data);
                // Truncate the file.
                fs.ftruncate(fileDescriptor, (fsFtruncateError) => {
                    if (!fsFtruncateError) {
                        fs.writeFile(fileDescriptor, stringData, (fsWriteError) => {
                            if (!fsWriteError) {
                                fs.close(fileDescriptor, (fsCloseError) => {
                                    if (!fsCloseError) {
                                        callback(false);
                                    } else {
                                        callback('Error closing the file.');
                                    }
                                });
                            } else {
                                callback('Error writing to existing file.');
                            }
                        });
                    } else {
                        callback('Error truncating file.');
                    }
                });
            } else {
                callback('Could not open the file for updating, it may not exist.');
            }
        },
    );
};

// Delete data file.
lib.delete = (dir, file, callback) => {
    // Unlink the file.
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (fsUnlinkError) => {
        if (!fsUnlinkError) {
            callback(false);
        } else {
            callback('Error deleting file.');
        }
    });
};

// Export the module
module.exports = lib;
