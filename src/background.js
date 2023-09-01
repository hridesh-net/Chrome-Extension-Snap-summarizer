'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

const OPENAI_API_KEY = '<enter your API key>';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OPENAI_API_KEY}`
};

chrome.tabs.onActivated.addListener(() => {
  console.log("installed")
  async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    console.log("tab printed")
    console.log(tab)

    console.log(tab.id)
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractContentSections
    });

    const pageContent = result[0].result;
    // console.log("pageContent")
    // console.log(pageContent)
    const summary = generateSummary(pageContent);
    console.log(summary)

    // return tab;
  }
  function analyzePage() {
    const pageContent = document.documentElement.innerHTML;
    // console.log(pageContent)
    return pageContent;
  }

  // function extractContentAndHTML() {
  //   const bodyCopy = document.body.cloneNode(true);
  
  //   const styleElements = bodyCopy.querySelectorAll('style');
  //   styleElements.forEach(styleElement => {
  //     styleElement.remove();
  //   });
  
  //   const allElements = bodyCopy.querySelectorAll('*');
  //   allElements.forEach(element => {
  //     element.removeAttribute('class');
  //     element.removeAttribute('style');
  //   });
  
  //   const content = bodyCopy.textContent;
  //   const html = bodyCopy.innerHTML;
  
  //   return content;
  // }

  function extractContentSections() {
    const sections = [];
  
    // Find all heading elements (you can adjust this based on your desired sections)
    const headings = document.querySelectorAll('h1, h2, h3');
  
    headings.forEach((heading, index) => {
      const section = {
        title: heading.textContent,
        content: '',
      };
  
      let currentNode = heading.nextSibling;
      while (currentNode && !currentNode.matches('h1, h2, h3')) {
        section.content += currentNode.textContent || '';
        currentNode = currentNode.nextSibling;
      }
  
      sections.push(section);
    });
  
    return sections;
  }

  function generateSummary(content) {

    // const textContent = content.replace(/<\/?[^>]+(>|$)/g, "");
    // const normalizedTextContent = textContent.trim().replace(/\s+/g, " ");
    console.log("List of the webpage content")
    console.log(content)
    // Implement your summary generation logic here
    // This can involve text analysis, summarization libraries, etc.
    // Return the generated summary

    const cont = textContent + "Give me the short summary of the content"

    const data = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: cont
        }
      ]
    };

    console.log("gathering response")

    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(result => {
        console.log(result);
      })
      .catch(error => {
        console.error('Error:', error);
      });

    return "This is a sample summary of the page content.";
  }

  getCurrentTab()
  console.log("outside")
  // console.log(tab)
})