async function loadArticle(path) {

  // 读取 markdown 文件
  const response = await fetch(path)

  const markdown = await response.text()

  // markdown 转 html
  const html = marked.parse(markdown)

  // 放进页面
  const article = document.getElementById("article")

  article.innerHTML = html

  // 数学公式渲染
  renderMathInElement(article, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false }
    ]
  })

  // 代码高亮
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block)
  })
}

function toggleCategory(element) {

  // 找到整个 category
  const category = element.parentElement

  // 切换 collapsed 类
  category.classList.toggle("collapsed")
}
