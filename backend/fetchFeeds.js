import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import Parser from 'rss-parser';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建rss-parser实例
const parser = new Parser();

const distDir = path.join(__dirname, '..', 'public');
const pagesDir = path.join(distDir, 'pages');
let metadata = [];

async function main() {
    // 确保dist目录存在

    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, {recursive: true});
    }

    if (!fs.existsSync(pagesDir)) {
        fs.mkdirSync(pagesDir, {recursive: true});
    }

    // 读取feed.json文件
    const feedsPath = path.join(__dirname, '..', 'feed.json');
    if (!fs.existsSync(feedsPath)) {
        console.error('feed.json文件不存在，请先创建该文件');
        process.exit(1);
    }

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));

    // 初始化metadata
    const metadataPath = path.join(distDir, 'metadata.json');

    if (fs.existsSync(metadataPath)) {
        // 从现有metadata.json文件中读取数据
        try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        } catch (e) {
            console.warn('解析现有metadata失败，将创建新的metadata');
            metadata = [];
        }
    }

    // 处理每个feed
    for (const feed of feeds) {
        console.log(`处理RSS源: ${feed.name} (${feed.url})`);
        await processFeed(feed);
    }

    // 按日期从新到旧排序（published字段）
    metadata.sort((a, b) => b.published - a.published);

    // 保存metadata为JSON格式
    saveMetadata(metadata, metadataPath);
    console.log('RSS源处理完成');

}

async function processFeed(feed) {
    console.log(`获取RSS数据: ${feed.url}`);

    try{

        // 解析RSS feed
        const rss = await parser.parseURL(feed.url);

        console.log(`成功解析RSS源 "${feed.name}"，共 ${rss.items.length} 篇文章`);

        // 处理每个文章
        for (const item of rss.items) {
            await processArticle(item);
        }
    }
    catch (e) {
        console.error(`无法解析RSS源 "${feed.name}" (${feed.url})`, e)
    }

}

async function processArticle(item) {

    // 检查是否已存在相同链接的文章
    const existingEntryIndex = metadata.findIndex(entry => entry.link === item.link);
    // 检查更新时间
    item.published = item.published || item.pubDate;
    item.updated = item.updated || item.pubDate;
    item.updated = new Date(item.updated).getTime();
    console.log(item.updated)
    // 生成文件名（基于链接的简化版本）
    const processed_link = item.link
        .replace(/^https?:\/\//, '')
        .replace(/[^\w\s-]/g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
    // 保存文章内容为HTML片段（只保存可渲染部分）
    item.content = item["content:encoded"] || item.content || item.description || (await fetch(item.link)).text();
    fs.writeFileSync(path.join(pagesDir, processed_link), item.content);
    item.content = path.join('pages', processed_link)

    item.summary = item.summary || '';

    const entry = {
        title: item.title,
        link: item.link,
        content: item.content,
        published: item.updated,
        fetched: Date.now(),
        author: item.author,
        summary: item.summary,
    };

    if (existingEntryIndex === -1) {
        metadata.push(entry);
        // 文章不存在，需要添加
        console.log(`文章不存在，将添加: ${item.title}`);
        return;
    }


    // 如果文章的更新时间大于上次获取时间，则需要更新
    if (item.updated > metadata[existingEntryIndex].fetched) {
        metadata[existingEntryIndex] = entry
        console.log(`文章有更新，将更新: ${item.title}`);
        return;
    }


    console.log(`文章已是最新，跳过: ${item.title}`);
}


function saveMetadata(metadata, metadataPath) {
    try {
        // 将metadata保存为JSON文件
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`元数据已保存到: ${metadataPath}`);
    } catch (error) {
        console.error('保存元数据时出错:', error);
    }
}

// 执行处理
main();