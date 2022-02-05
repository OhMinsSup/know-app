import chalk from 'chalk';
import shell from 'shelljs';
import * as Commander from 'commander';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const program = new Commander.Command('know-app')
	.option(
		'-e, --environment <environment>',
		'어떤 .env.* 환경변수 파일을 사용할지 선택합니다.',
		'local'
	)
	.option('-c --css <css>', 'css를 추가|삭제합니다.')
	.allowUnknownOption()
	.parse(process.argv);

const envRegex = /^(local|development|production|dev|prod|p|d)$/;

const transform = (environment: string) => {
	if (environment.match(/^(dev|development|d)$/)) {
		return environment.replace(/^(dev|development|d)$/, '.env.development');
	}

	if (environment.match(/^(prod|production|p)$/)) {
		return environment.replace(/^(prod|production|p)$/, '.env.production');
	}

	return environment.replace(envRegex, '.env.$1');
};

interface EnvironmentStepUp {
	rootEnvironment?: string;
	environment?: string;
}

function environmentStepUp(params: EnvironmentStepUp | undefined) {
	const { rootEnvironment = '.env', environment = '.env.local' } = params;
	const appPath = path.resolve();
	const configPath = path.resolve(appPath, './scripts/config');

	// config 폴더가 없으면 생성
	if (!fs.existsSync(configPath)) {
		console.log(chalk.yellow('Environment] -  config empty, create config folder'));
		shell.mkdir('-p', configPath);
	}

	const validFiles = [
		'.env.local',
		'.env.dev',
		'.env.development',
		'.env.prod',
		'.env.production',
		'.env.test'
	];

	const checkList = fs.readdirSync(configPath).filter((file) => !validFiles.includes(file));
	if (checkList.length > 0) {
		console.log(
			chalk.yellow(
				`[Environment] - config files is not found ${chalk.blue(checkList.join(', '))}`
			)
		);
		shell.exit(1);
	}

	// load by project environment variables
	let env: dotenv.DotenvConfigOutput | undefined;

	const envPath = path.resolve(configPath, environment);
	const rootPath = path.resolve(appPath, rootEnvironment);

	try {
		env = dotenv.config({
			path: envPath
		});

		if (env.error) {
			throw env.error;
		}
	} catch (error) {
		console.log(
			`${chalk.red(
				`[Environment] - "${error.message}"`
			)}. Please fix the environment variable and try again.`
		);
		shell.exit(1);
	}

	if (!env) {
		console.log(
			` ${chalk.red(
				` [Environment] - "${configPath}" is not found. `
			)}. Please fix the environment variable and try again.`
		);
		shell.exit(1);
	}

	// env variables copy for env to root folder .env copy
	fs.copyFileSync(envPath, rootPath);
	// success load by project environment variables
	console.log(`${chalk.green('Success!')} Created ${rootEnvironment}`);
}

function removeCssImports() {
	const folderfiles = fs.readdirSync('./src/routes');
	const rootLayout = folderfiles.filter((file) => file.includes('__layout.svelte'));
	const pathToRootLayout = './src/routes/__layout.svelte';

	if (rootLayout.length === 0) {
		console.log(chalk.red('[addCssImports] - __layout.svelte is not found'));
	} else {
		const layout = fs.readFileSync(pathToRootLayout, {
			encoding: 'utf8'
		});
		const writeToFile = (filePath: string, data: string | NodeJS.ArrayBufferView): void =>
			fs.writeFileSync(filePath, data);
		const updatedLayout = layout.replace("import '../styles/tailwind.postcss';", '');
		writeToFile(pathToRootLayout, updatedLayout);
	}
}

function addCssImports() {
	const folderfiles = fs.readdirSync('./src/routes');
	const rootLayout = folderfiles.filter((file) => file.includes('__layout.svelte'));
	const pathToRootLayout = './src/routes/__layout.svelte';

	if (rootLayout.length === 0) {
		console.log(chalk.red('[addCssImports] - __layout.svelte is not found'));
	} else {
		const layout = fs.readFileSync(pathToRootLayout, {
			encoding: 'utf8'
		});
		const writeToFile = (filePath: string, data: string | NodeJS.ArrayBufferView): void =>
			fs.writeFileSync(filePath, data);
		const isImportPresent = layout.includes("import '../styles/tailwind.postcss';");
		if (isImportPresent) {
			console.log(chalk.yellow('[addCssImports] - tailwind.postcss is already added'));
		} else {
			const updatedLayout = layout.replace(
				'// Start: External Imports',
				`// Start: External Imports
		import '../styles/tailwind.postcss';`
			);
			console.log('updatedLayout ===>', updatedLayout);
			writeToFile(pathToRootLayout, updatedLayout);
		}
	}
}

export function run() {
	const options = program.opts();

	if (options.environment && !envRegex.test(options.environment)) {
		console.log(chalk.red(`[cli] - "${options.environment}" is not valid environment.`));
		shell.exit(1);
	}

	const environment = transform(options.environment);

	environmentStepUp({
		rootEnvironment: '.env',
		environment
	});

	if (options.css) {
		const addCss = options.css.match(/^(yes|y|on)$/);
		const removeCss = options.css.match(/^(no|n|off)$/);

		if (addCss) {
			console.log(chalk.yellow('[cli] - add css'));
			addCssImports();
			console.log(chalk.green('[cli] - add css done'));
		} else if (removeCss) {
			console.log(chalk.yellow('[cli] - remove css'));
			removeCssImports();
			console.log(chalk.green('[cli] - remove css done'));
		}
	}

	return;
}

run();
