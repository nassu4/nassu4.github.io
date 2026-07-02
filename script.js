function convertBlockquotesToHtml(markdown) {
  const lines = markdown.split(/\r?\n/)
  const output = []
  let quoteBuffer = []
  let inQuote = false

  const flushQuote = () => {
    if (!quoteBuffer.length) {
      return
    }

    const quoteContent = quoteBuffer.join("\n")
    output.push(`<blockquote>${marked.parse(quoteContent)}</blockquote>`)
    quoteBuffer = []
  }

  lines.forEach((line) => {
    const trimmed = line.trimStart()
    const isQuoteLine = /^>/.test(trimmed)

    if (isQuoteLine) {
      if (!inQuote) {
        inQuote = true
        quoteBuffer = []
      }

      quoteBuffer.push(trimmed.replace(/^>\s?/, "").trim())
      return
    }

    if (inQuote) {
      flushQuote()
      inQuote = false
    }

    output.push(line)
  })

  if (inQuote) {
    flushQuote()
  }

  return output.join("\n")
}

function renderMarkdownWithReferences(markdown) {
  const lines = markdown.split(/\r?\n/)
  const citations = new Map()
  const footnotes = new Map()
  const bodyLines = []

  let inCodeBlock = false

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (/^```/.test(trimmed) || /^~~~/.test(trimmed)) {
      inCodeBlock = !inCodeBlock
      bodyLines.push(line)
      return
    }

    if (inCodeBlock) {
      bodyLines.push(line)
      return
    }

    const defMatch = line.match(/^\[(\^?[^\]]+)\]:\s*(.+)$/)
    if (defMatch) {
      const key = defMatch[1].trim()
      const value = defMatch[2].trim()

      if (key.startsWith("^")) {
        footnotes.set(key.slice(1), value)
      } else {
        citations.set(key, value)
      }

      return
    }

    bodyLines.push(line)
  })

  let body = bodyLines.join("\n")

  body = body.replace(/(?<!\!)\[(\^?[\w\-]+)\](?!\()/g, (match, key) => {
    if (key.startsWith("^")) {
      const footnoteKey = key.slice(1)
      return footnotes.has(footnoteKey)
        ? `<sup class="reference-link"><a href="#footnote-${footnoteKey}">${match}</a></sup>`
        : match
    }

    return citations.has(key)
      ? `<sup class="reference-link"><a href="#citation-${key}">${match}</a></sup>`
      : match
  })

  body = convertBlockquotesToHtml(body)

  let html = marked.parse(body)

  const referenceItems = []

  citations.forEach((value, key) => {
    referenceItems.push(`<li id="citation-${key}"><strong>[${key}]</strong> ${value}</li>`)
  })

  footnotes.forEach((value, key) => {
    referenceItems.push(`<li id="footnote-${key}"><strong>[^${key}]</strong> ${value}</li>`)
  })

  if (referenceItems.length > 0) {
    html += `<div class="markdown-references"><h3>参考资料</h3><ol>${referenceItems.join("")}</ol></div>`
  }

  return html
}

async function loadArticle(path) {

  // 读取 markdown 文件
  const response = await fetch(path)

  const markdown = await response.text()

  // markdown 转 html
  const html = renderMarkdownWithReferences(markdown)

  // 放进页面
  const article = document.getElementById("article")

  article.innerHTML = html

  // 数学公式渲染
  renderMathInElement(article, {
    delimiters: [
      { left: "$$", right: "$$", display: true }
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

const sidebar = document.getElementById("sidebar")
const app = document.getElementById("app")
const sidebarToggle = document.getElementById("sidebar-toggle")

if (sidebar && app && sidebarToggle) {
  const updateSidebarToggle = () => {
    const collapsed = sidebar.classList.contains("collapsed")
    app.classList.toggle("sidebar-collapsed", collapsed)
    sidebarToggle.textContent = collapsed ? "▶" : "◀"
    sidebarToggle.setAttribute("aria-label", collapsed ? "展开侧边栏" : "收起侧边栏")
    sidebarToggle.title = collapsed ? "展开侧边栏" : "收起侧边栏"
  }

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed")
    updateSidebarToggle()
  })

  updateSidebarToggle()
}
