// Based off of https://codesandbox.io/s/fetching-local-files-62ih5?file=/src/index.js:0-646

// https://github.com/mdn/yari/blob/8273a5275fa947d40befb626e99aa9d5eb84ee3b/client/src/search.tsx
// https://github.com/nextapps-de/flexsearch/blob/master/demo/autocomplete.html

// import React from 'react'
// import ReactDOM from 'react-dom'
// import { useState, useEffect, useCallback } from 'react'
// import Index from "./index.js";
import FlexSearch from 'flexsearch'
import Mark from 'mark.js'

import './styles.css'
import data from './movies.js'

const now =
  window.performance && performance.now ? () => performance.now() : Date.now()

let dirty = true

async function getFile(fileUrl) {
  return fetch(fileUrl).then((r) => r.text())
}

const Statistics = () => {
  let index_ = 0
  let sum_ = 0
  let then_ = now()

  return {
    start: () => {
      then_ = now()
    },
    finish: () => {
      sum_ += now() - then_
      ++index_
    },
    average: () => (index_ === 0 ? 0 : sum_ / index_)
  }
}

const stats = {
  initialIndex: Statistics(),
  subsequentIndexing: Statistics(),
  search: Statistics()
}

async function main() {
  const file1Name = 'test1.txt' // '/Users/paris/repo/code8/c8/hpoint.cc'
  const file2Name = 'test2.txt' //'/Users/paris/repo/code8/c8/quaternion.cc'
  const file1 = await getFile(file1Name)
  const file2 = await getFile(file2Name)

  // const div1 = document.getElementById('file1')
  // div1.textContent = file1
  stats.initialIndex.start()
  const index = new FlexSearch.Index({
    // charset: 'latin:advanced',
    tokenize: 'full',
    cache: 100,
    threshold: 0,
    resolution: 9, // 9 is default
    // depth: 0,
    // context: {
    //   depth: 2,
    //   resolution: 5,
    //   bidirectional: true,
    // },
    context: false,
    // the default encoder removes special characters. define a new encoder that just splits on spaces.
    // https://github.com/nextapps-de/flexsearch/issues/197
    // https://github.com/nextapps-de/flexsearch/issues/145
    encode: function (str) {
      const s = str.toLowerCase().split(/(\s+)/)
      console.log(s)
      return s
      // return str.split(/\s+/g)
      // str.split(/(\s+)/);
      // return str //.toLowerCase()
    }
  })
  const fileNameToContent = {}
  fileNameToContent[file1Name] = file1
  fileNameToContent[file2Name] = file2
  const fileNameToTag = {}
  const tagToFileName = {}
  const tagIdToLine = {}
  let i = 0
  Object.entries(fileNameToContent).forEach(([fileName, content]) => {
    let tag = fileNameToTag[fileName]
    if (!tag) {
      fileNameToTag[fileName] = i++
      tag = fileNameToTag[fileName]
      tagToFileName[tag] = fileName
    }
    let id = 0
    content.split('\n').forEach((line) => {
      const tagId = `${tag}-${id++}`
      tagIdToLine[tagId] = line
      // console.log(tagId, line) // paris debug
      index.add(tagId, line)
    })
  })
  stats.initialIndex.finish()
  dirty = true

  var suggestions = document.getElementById('suggestions')
  var autocomplete = document.getElementById('autocomplete')
  var userinput = document.getElementById('userinput')

  userinput.addEventListener('input', show_results, true)
  userinput.addEventListener('keyup', accept_autocomplete, true)
  suggestions.addEventListener('click', accept_suggestion, true)

  // HighlightMatch('test string', 't')

  function createElementFromHTML(htmlString) {
    var div = document.createElement('div')
    div.innerHTML = htmlString
    // console.log('div.innerHTML:', div.innerHTML)

    // Change this to div.childNodes to support multiple top-level nodes
    // return div.firstChild;
    return div
  }

  // suggestions.appendChild(createElementFromHTML(HighlightMatch('<test>', '<t')))
  // suggestions.appendChild(createElementFromHTML(highlight('test<?test>', 't')))

  function highlight(content, keyword) {
    const newKeyword = `<mark>${keyword}</mark>`
    const resContent = content.replace(keyword, newKeyword)

    console.log('----')
    console.log('keyword: ', keyword)
    console.log('content: ', content)
    console.log('resContent: ', resContent)

    return resContent

    // Content would be
    // &lt;<em>audio</em>&gt;: The Embed <em>Audio</em> element
  }

  function highlight1(content, keyword) {
    // const keyword = 'audio';
    // const content = '&lt;audio&gt;: The Embed Audio element'

    // Make sure there's no regex special chars
    const sanitizedKeyword = keyword.replace(/\W/g, '')

    // Build regex
    const regexForContent = new RegExp(sanitizedKeyword, 'gi')

    // Replace content where regex matches
    // const resContent = content.replace(regexForContent, '<em>$&</em>');
    const resContent = content.replace(regexForContent, '<mark>$&</mark>')

    console.log('----')
    console.log('keyword: ', keyword)
    console.log('content: ', content)
    console.log('sanitizedKeyword: ', sanitizedKeyword)
    console.log('resContent: ', resContent)

    return resContent

    // Content would be
    // &lt;<em>audio</em>&gt;: The Embed <em>Audio</em> element
  }

  function HighlightMatch(title, q) {
    // FlexSearch doesn't support finding out which "typo corrections"
    // were done unfortunately.
    // See https://github.com/nextapps-de/flexsearch/issues/99

    // Split on higlight term and include term into parts, ignore case.
    const words = q.trim().toLowerCase().split(/[ ,]+/)
    console.log(title, q, words)

    // $& means the whole matched string
    const regexWords = words.map((s) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    const regex = `\\b(${regexWords.join('|')})`
    const parts = title.split(new RegExp(regex, 'gi'))

    let ret = ''
    parts.map((part, i) => {
      const key = `${part}:${i}`
      if (words.includes(part.toLowerCase())) {
        // console.log(`<mark key=${key}>${part}</mark>`)
        ret = ret.concat(`<mark key=${key}>${part}</mark>`)
      } else {
        // console.log(`<span key=${key}>${part}</span>`)
        ret = ret.concat(`<span key=${key}>${part}</span>`)
      }
    })
    console.log(ret)
    dirty = true
    return ret

    // for a node component
    // return (
    //   <b>
    //     {parts.map((part, i) => {
    //       const key = `${part}:${i}`
    //       if (words.includes(part.toLowerCase())) {
    //         return <mark key={key}>{part}</mark>
    //       } else {
    //         return <span key={key}>{part}</span>
    //       }
    //     })}
    //   </b>
    // )
  }

  function show_results() {
    console.log('[show_results] value: ', this.value)
    var value = this.value
    stats.search.start()
    var results = index.search(value, { suggest: false, limit: 10 })
    console.log(results)
    stats.search.finish()
    var entry = null
    var childs = suggestions.childNodes
    var i = 0
    var len = results.length
    console.log(results)
    for (; i < len; i++) {
      entry = childs[i]

      if (!entry) {
        entry = document.createElement('div')
        // entry = createElementFromHTML(
        // // HighlightMatch(tagIdToLine[results[i]], value)
        // highlight(tagIdToLine[results[i]], value)
        // )
        suggestions.appendChild(entry)
      }

      // const tagId = `${tag}-${id++}`

      const tag = results[i].split('-')[0]
      const id = results[i].split('-')[1]
      entry.textContent = tagIdToLine[results[i]]
      // entry.innerHTML =
      //   // HighlightMatch(tagIdToLine[results[i]], value)
      //   highlight(tagIdToLine[results[i]], value)
      var instance = new Mark(entry)
      instance.mark(value)

      entry.innerHTML =
        entry.innerHTML +
        `<br/><b><i>file: ${tagToFileName[tag]}, line ${id}</b></i>`
    }

    while (childs.length > len) {
      suggestions.removeChild(childs[i])
    }

    var first_result = tagIdToLine[results[0]]
    var match =
      first_result && first_result.toLowerCase().indexOf(value.toLowerCase())

    if (first_result && match !== -1) {
      autocomplete.value = value + first_result.substring(match + value.length)
      autocomplete.current = first_result
    } else {
      autocomplete.value = autocomplete.current = value
    }
    dirty = true
  }

  function accept_autocomplete(event) {
    if ((event || window.event).keyCode === 13) {
      this.value = autocomplete.value = autocomplete.current
    }
  }

  function accept_suggestion(event) {
    var target = (event || window.event).target

    userinput.value = autocomplete.value = target.textContent

    while (suggestions.lastChild) {
      suggestions.removeChild(suggestions.lastChild)
    }

    return false
  }
}

main()

//--------------------------------------------------------------------------------------------------
// Run performance benchmark
//--------------------------------------------------------------------------------------------------
function render() {
  if (dirty === false) {
    requestAnimationFrame(render)
    return
  }
  dirty = false
  // Update stats.
  document.querySelector(
    'pre'
  ).innerHTML = `initialIndex:  ${stats.initialIndex.average().toFixed(3)} ms
subsequentIndexing:  ${stats.subsequentIndexing.average().toFixed(3)} ms
search:  ${stats.search.average().toFixed(3)} ms`
  requestAnimationFrame(render)
}
render()

//--------------------------------------------------------------------------------------------------
// Code to highlight search query
//--------------------------------------------------------------------------------------------------

// import React from 'react'
// import { Dropdown, Header } from 'semantic-ui-react'

// // A
// // first get positions to start and end marks
// // then convert string to non-html
// // then add in start and end marks

// // B
// // first convert string to non-html
// // convert search term to non-html
// // replace all with <mark>search term non html</mark>
// // console.log(safeLine)
// // console.log(safeSearchValue)
// // const newLine = safeLine.replace(
// //   safeSearchValue,
// //   `<mark>${safeSearchValue}</mark>`
// // )

// const safeHtmlString = (s) => {
//   return String(s)
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;')
// }

// const highlightLine = (line, searchValue) => {
//   // A
//   searchValue = ''
//   line = 'test sentence test hello'
//   // ".*(?i)"+s2+".*"
//   // boolean found = s1.matches("(?i).*" + s2+ ".*");
//   // var patt = /${searchValue}/igm;
//   const isCaseSensitive = true
//   var modifiers = isCaseSensitive ? 'gi' : 'g'
//   var patt = new RegExp(searchValue, modifiers)
//   const res = []
//   let match
//   let end = 0
//   // eslint-disable-next-line no-cond-assign
//   while ((match = patt.exec(line))) {
//     console.log(match.index + ' ' + patt.lastIndex)
//     console.log(line.substring(end, match.index))
//     console.log(line.substring(match.index, patt.lastIndex))
//     res.push(
//       <span>
//         {line.substring(end, match.index)}
//         {<mark>{line.substring(match.index, patt.lastIndex)}</mark>}
//       </span>
//     )
//     end = patt.lastIndex
//   }
//   res.push(
//     <span>
//       {line.substring(end, line.length)}
//     </span>
//   )

//   return res

//   // Works but case sensitive
//   // const safeLine = line // safeHtmlString(line)
//   // const safeSearchValue = searchValue //safeHtmlString(searchValue)
//   // const split = safeLine.split(safeSearchValue)
//   // let i = 1
//   // return split.map((s) => {
//   //   return (
//   //     <span>
//   //       {s}
//   //       {i++ < split.length ? <mark>{safeSearchValue}</mark> : ''}
//   //     </span>
//   //   )
//   // })
// }

// const c =
//   "<Header icon='mobile' content='Mobile' subheader='The smallest size' />"
// const d = 'test'
// // const a = <Header icon='mobile' content={d} subheader='The <br>smallest</br> size' />
// const a = React.createElement('li', { id: 'li1' }, 'one')

// const options = [
//   {
//     key: 1,
//     text: <div>{highlightLine('Test sentence test hello', 'tEst')}</div>,
//     value: 1,
//     content: <Header icon="mobile" content={d} subheader="The smallest size" />
//   },
//   {
//     key: 2,
//     text: 'Tablet',
//     value: 2,
//     content: (
//       <Header
//         icon="tablet"
//         content="Tablet"
//         subheader="The size in the middle"
//       />
//     )
//   },
//   {
//     key: 3,
//     text: 'Desktop',
//     value: 3,
//     content: (
//       <Header icon="desktop" content="Desktop" subheader="The largest size" />
//     )
//   }
// ]

// const DropdownExampleItemContent = () => (
//   <Dropdown selection fluid options={options} placeholder="Choose an option" />
// )

// export default DropdownExampleItemContent
