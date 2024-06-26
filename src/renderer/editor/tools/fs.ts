import Glob from "glob";
import rimraf from "rimraf";
import { mkdir, pathExists } from "fs-extra";
import directoryTree, { DirectoryTree } from "directory-tree";

import { Tools } from "./tools";

export class FSTools {
	/**
	 * Creates the directory at the given absolute path. If the directory already exists, nothing is done.
	 * @param path defines the absolute path to the directory to create.
	 */
	public static async CreateDirectory(path: string): Promise<void> {
		if (await pathExists(path)) {
			return;
		}

		await mkdir(path);
	}

	/**
	 * Flattens the list of files available (recursively) in the given directory path.
	 * @param directoryPath defines the path to the directory to recursively get its files.
	 * @param ignore defines the array of folders/files to ignore.
	 * @returns the list of all files located (recursively) in the given directory path.
	 */
	public static GetGlobFiles(directoryPath: string, ignore?: string[]): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			Glob(directoryPath, { ignore }, (err, files) => {
				if (err) {
					return reject(err);
				}

				resolve(files);
			});
		});
	}

	/**
	 * Returns the tree of all available directories and files in the given directory path.
	 * @param directoryPath defines the absolute path to the directory to get its tree.
	 * @returns the tree of all available directories and files in the given directory path.
	 */
	public static GetDirectoryTree(directoryPath: string): DirectoryTree {
		return directoryTree(directoryPath);
	}

	/**
	 * Removes the given directory recursively.
	 * @param directoryPath defines the absolute path to the directory to remove.
	 */
	public static RemoveDirectory(directoryPath: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			rimraf(directoryPath, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Waits until the given file (absolute path) exists.
	 * @param filePath defines the absolute path to the file to test until it exists.
	 * @param timeout defines the optional timeout to resolve the promise @default 10000
	 */
	public static async WaitUntilFileExists(filePath: string, timeout: number = 10000): Promise<void> {
		return new Promise<void>(async (resolve) => {
			let done = false;

			const timeoutId = setTimeout(() => done = true, timeout);
			
			while (!done) {
				const exists = await pathExists(filePath);
				if (exists) {
					break;
				}

				await Tools.Wait(150);
			}

			resolve();
			clearTimeout(timeoutId);
		});
	}
}
