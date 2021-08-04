// Based off of https://codesandbox.io/s/fetching-local-files-62ih5?file=/src/index.js:0-646

// https://github.com/mdn/yari/blob/8273a5275fa947d40befb626e99aa9d5eb84ee3b/client/src/search.tsx
// https://github.com/nextapps-de/flexsearch/blob/master/demo/autocomplete.html

// import React from 'react'
// import ReactDOM from 'react-dom'
// import { useState, useEffect, useCallback } from 'react'
// import Index from "./index.js";
import FlexSearch from 'flexsearch'
import lunr from 'lunr'

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

  const builder = new lunr.Builder()
  builder.metadataWhitelist.push('position')
  builder.ref('id')
  builder.field('content')

  // var idx = lunr(function () {
  //   this.ref('id')
  //   this.field('body')
  //   this.metadataWhitelist = ['position']

  //   documents.forEach(function (doc) { this.add(doc) }, this)
  // })

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
      // index.add(tagId, line)
      builder.add({ id: tagId, content: line })
    })
  })
  const index = builder.build()

  var suggestions = document.getElementById('suggestions')
  var autocomplete = document.getElementById('autocomplete')
  var userinput = document.getElementById('userinput')

  userinput.addEventListener('input', show_results, true)

  function show_results() {
    console.log(' ----- [show_results] value: ', this.value)
    var value = this.value
    // var results = index.search(value, 25, { suggest: true })
    var results = index.search(value)

    var entry = null
    var childs = suggestions.childNodes
    var i = 0
    var len = results.length

    for (; i < len; i++) {
      // console.log(results[i].matchData.metadata.a.content.position[0],tagIdToLine[results[i].ref])
      entry = childs[i]
      console.log(results[i].ref, tagIdToLine[results[i].ref], results[i].score)
      if (!entry) {
        entry = document.createElement('div')
        suggestions.appendChild(entry)
      }

      entry.textContent = tagIdToLine[results[i].ref]
      // entry.innerHTML = highlight(entry, results[i].matchData.metadata.a.content.position)
    }

    while (childs.length > len) {
      suggestions.removeChild(childs[i])
    }

    var first_result = results[0] && tagIdToLine[results[0].ref]
    var match =
      first_result && first_result.toLowerCase().indexOf(value.toLowerCase())

    if (first_result && match !== -1) {
      autocomplete.value = value + first_result.substring(match + value.length)
      autocomplete.current = first_result
    } else {
      autocomplete.value = autocomplete.current = value
    }

    // highlight(suggestions, results)
  }

  /**
   * Represents the location of a match within a
   * larger string. Extracted from a lunr.Index~Result.
   *
   * @typedef {number[]} MatchLocation
   * @property {number} 0 - Starting index of the match
   * @property {number} 1 - Length of the match
   */

  /**
   * Highlights text within a dom element.
   *
   * Specifically this is designed to work with the output
   * positions of terms returned from a lunr search.
   *
   * @param {HTMLElement} element - the element that contains text to highlight.
   * @param {MatchLocation[]} matches - the list of matches to highlight.
   */
  function highlight(element, matches) {
    var nodeFilter = {
      acceptNode: function (node) {
        if (/^[\t\n\r ]*$/.test(node.nodeValue)) {
          return NodeFilter.FILTER_SKIP
        }
        return NodeFilter.FILTER_ACCEPT
      }
    }

    var index = 0,
      matches = matches
        .sort(function (a, b) {
          return a[0] - b[0]
        })
        .slice(),
      previousMatch = [-1, -1]
    ;(match = matches.shift()),
      (walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        nodeFilter,
        false
      ))
    console.log(matches)
    while ((node = walker.nextNode())) {
      if (match == undefined) break
      if (match[0] == previousMatch[0]) continue

      var text = node.textContent,
        nodeEndIndex = index + node.length

      if (match[0] < nodeEndIndex) {
        var range = document.createRange(),
          tag = document.createElement('mark'),
          rangeStart = match[0] - index,
          rangeEnd = rangeStart + match[1]

        tag.dataset.rangeStart = rangeStart
        tag.dataset.rangeEnd = rangeEnd

        range.setStart(node, rangeStart)
        range.setEnd(node, rangeEnd)
        range.surroundContents(tag)

        index = match[0] + match[1]

        // the next node will now actually be the text we just wrapped, so
        // we need to skip it
        walker.nextNode()
        previousMatch = match
        match = matches.shift()
      } else {
        index = nodeEndIndex
      }
    }
  }
}

main()
