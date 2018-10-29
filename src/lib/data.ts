import fs from "fs";
import path from "path";
import { LooseObject } from "../interfaces";

const lib: LooseObject = {};

lib.baseDir = path.join(__dirname, "/../.data/");

lib.create = (dir: string, file: string, data: object, callback: any): void => {
    fs.open(
        `${lib.baseDir}${dir}/${file}.json`,
        "wx",
        (error, fileDescriptor) => {
            if (!error && fileDescriptor) {
                const stringData = JSON.stringify(data);
                fs.writeFile(fileDescriptor, stringData, (error) => {
                    if (!error) {
                        fs.close(fileDescriptor, (error) => {
                            if (!error) {
                                callback(false);
                            } else {
                                callback("Error closing new file.");
                            }
                        });
                    } else {
                        callback("Error writing to new file.");
                    }
                });
            } else {
                callback("Could not create new file, it may already exist.");
            }
        }
    );
};

lib.read = (dir: string, file: string, callback: any): void => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, "utf8", (error, data) => {
        if (!error) {
            callback(false, data);
        } else {
            callback("Error reading file, it may not exist.");
        }
    });
};

lib.update = (dir: string, file: string, data: object, callback: any): void => {
    fs.open(
        `${lib.baseDir}${dir}/${file}.json`,
        "r+",
        (error, fileDescriptor) => {
            if (!error && fileDescriptor) {
                const stringData = JSON.stringify(data);
                fs.ftruncate(fileDescriptor, (error) => {
                    if (!error) {
                        fs.writeFile(fileDescriptor, stringData, (error) => {
                            if (!error) {
                                fs.close(fileDescriptor, (error) => {
                                    if (!error) {
                                        callback(false);
                                    } else {
                                        callback("Error closing the file.");
                                    }
                                });
                            } else {
                                callback("Error writing to existing file.");
                            }
                        });
                    } else {
                        callback("Error truncating file.");
                    }
                });
            } else {
                callback(
                    "Could not open the file for updating, it may not exist yet."
                );
            }
        }
    );
};

lib.delete = (dir: string, file: string, callback: any): void => {
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (error) => {
        if (!error) {
            callback(false);
        } else {
            callback("Error deleting file, it may not exist anymore.");
        }
    });
};

export default lib;
