/**
 * 前端后端模块
 * 从生成的文件中加载数据供前端使用
 */


// 缓存元数据
let metadata = [];

function withBase(url) {
    return import.meta.env.BASE_URL + url;
}

/**
 * 加载metadata.json文件
 */
async function loadMetadata() {
    // 在浏览器环境中加载生成的metadata.json文件
    const response = await fetch(withBase('/metadata.json'));
    if (response.ok) {
        metadata = await response.json();
        return metadata;
    } else {
        throw new Error(`无法加载元数据: ${response.status} ${response.statusText}`);
    }
}

export async function getArticles() {
    // 确保元数据已加载
    if (metadata.length === 0) {
        await loadMetadata();
    }

    // 将时间戳转换为可读格式
    return metadata.map(item => ({
        ...item,
        published: new Date(item.published).toLocaleString(),
        fetched: new Date(item.fetched).toLocaleString()
    }));
}

export async function getContent(content) {
    // 从指定路径获取文章内容
    const response = await fetch(withBase(`/${content}`));
    if (response.ok) {
        return await response.text();
    } else {
        throw new Error(`无法获取文章内容: ${response.status} ${response.statusText}`);
    }

}