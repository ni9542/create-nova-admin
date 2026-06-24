#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { downloadTemplate } from 'giget'; // 替换为现代下载器
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

const program = new Command();

program
    .version('1.0.0')
    .arguments('[project-name]')
    .description('创建一个新的 Pomelo Admin 后台管理项目')
    .action(async (projectName) => {

        const prompts = [];

        if (!projectName) {
            prompts.push({
                type: 'input',
                name: 'name',
                message: '✨ 请输入你的后台项目名称:',
                default: 'pomelo-admin-app',
            });
        }

        prompts.push({
            type: 'list',
            name: 'template',
            message: '🛠️ 请选择你要使用的后台模版预设:',
            choices: [
                {
                    name: `${chalk.green('Element Plus')} + ${chalk.blue('TypeScript')} + Pinia (推荐)`,
                    value: 'element-plus-ts'
                }
            ]
        });

        const answers = await inquirer.prompt(prompts);
        projectName = projectName || answers.name;

        const targetDir = path.join(process.cwd(), projectName);

        if (fs.existsSync(targetDir)) {
            console.log(chalk.red(`\n❌ 错误：目录 "${projectName}" 已存在，请换个名字或先手动删除它。`));
            return;
        }

        console.log(chalk.blue(`\n🚀 开始构建你的 Pomelo Admin...`));
        console.log(chalk.gray(`技术栈配置: Vue3, Element Plus, TypeScript, Pinia, Vue Router\n`));

        const spinner = ora('正在从云端拉取最新 Pomelo Admin 模版...').start();

        try {
            // giget 格式非常简单直接：github:用户名/仓库名#分支
            await downloadTemplate('github:ni9542/nova-admin-template#main', {
                dir: targetDir,
                force: true
            });

            spinner.succeed(chalk.green('模版下载成功！'));

            const pkgPath = path.join(targetDir, 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                pkg.name = projectName;
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
            }

            console.log('\n' + chalk.bold.green(`🎉 恭喜！你的 Pomelo Admin 项目已初始化完成！`));
            console.log(`\n请依次执行以下命令启动项目：\n`);
            console.log(chalk.cyan(`  cd ${projectName}`));
            console.log(chalk.cyan(`  npm install`));
            console.log(chalk.cyan(`  npm run dev\n`));

        } catch (err) {
            spinner.fail(chalk.red('下载模版失败！'));
            console.error(err);
        }
    });

program.parse(process.argv);
