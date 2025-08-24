
# rss-reader
## requirements
* the site is pure static, no actual backend needed, I will call the page fetch and process as the backend
* use vue for frontend, and element-plus as the component library
* use nodejs as backend

## design
set DIST as the output directory

### backend
the backend do the followings:

1. fetch each rss feed
2. load and compare with the metadata, for new or revision of the article, update the metadata and save the html file to `/$DIST/pages/`
#### feed format
/feed.json
```ts
interface Feed {
    name: string,
    url: string
}

//in json file: Feed[]
```
#### metadata
/${DIST}/metadata.json
```ts
interface Entry {
    title: string,
    link: string,
    content: string,
    published: number,
    fetched: number,
    author: string,
    summary: string,
}

//in json file: Entry[]
```
* `content`: is not the html content of the article, but the .html link in the site:
`pages/${preprocess of link}.html` 
it points to the html file 
`/$DIST/pages/${preprocess of link}.html`
* `fetched`: the time when the article is last fetched ,as number to make it easier to compare
* `published`: the time when the article is published, as number to keep in line with `fetched`

### api
backend provide an api to get metadata and html content (this is run in the client browser, not the prebuild step)
```ts
interface Article {
    title: string,
    link: string,
    published: string,//readable format
    fetched: string,//readable format
    author: string,
    summary: string,
}
interface Backend{
    getArticles():()=>Article[],
    getContent(link:string):()=>string,//link-to-html
}
```

### frontend