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

async function getFile(fileUrl) {
  return fetch(fileUrl).then((r) => r.text())
}

async function main() {
  const file1Name = 'test1.txt' // '/Users/paris/repo/code8/c8/hpoint.cc'
  const file2Name = 'test2.txt' //'/Users/paris/repo/code8/c8/quaternion.cc'
  const file1 = await getFile(file1Name)
  const file2 = await getFile(file2Name)

  // const div1 = document.getElementById('file1')
  // div1.textContent = file1

  const index = new FlexSearch.Index({
    // charset: 'latin:advanced',
    tokenize: 'full',
    cache: true,
    resolution: 9, // 9 is default
    context: true,
    // the default encoder removes special characters. define a new encoder that just splits on spaces.
    // https://github.com/nextapps-de/flexsearch/issues/197
    // https://github.com/nextapps-de/flexsearch/issues/145
    encode: function (str) {
      return str.split(/\s+/g)
    }
  })
  const fileNameToContent = {}
  fileNameToContent[file1Name] = file1
  fileNameToContent[file2Name] = file2
  const fileNameToTag = {}
  const tagIdToLine = {}
  let i = 0
  Object.entries(fileNameToContent).forEach(([fileName, content]) => {
    let tag = fileNameToTag[fileName]
    if (!tag) {
      fileNameToTag[fileName] = i++
      tag = fileNameToTag[fileName]
    }
    let id = 0
    content.split('\n').forEach((line) => {
      const tagId = `${tag}-${id++}`
      tagIdToLine[tagId] = line
      index.add(tagId, line)
    })
  })

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
    var results = index.search(value, { suggest: true, limit: 10 })
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

      const file
      entry.textContent = tagIdToLine[results[i]]
      // entry.innerHTML =
      //   // HighlightMatch(tagIdToLine[results[i]], value)
      //   highlight(tagIdToLine[results[i]], value)
      var instance = new Mark(entry)
      instance.mark(value)
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
