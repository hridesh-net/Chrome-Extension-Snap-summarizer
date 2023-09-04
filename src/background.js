'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

const summary = [];
const OPENAI_API_KEY = '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';
const apiUrl = 'https://api.openai.com/v1/chat/completions';

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
      function: extractContentAndHTML
    });

    const pageContent = result[0].result;
    const modifiedText = removeWideSpaces(pageContent);
    // console.log(modifiedText)

    const validText = getValidLengthText(modifiedText);
    console.log(validText)

    const serverRes = await sendToExpressServer(validText)
    console.log(serverRes)

    //   generateSummary(validText).then((res) => {
    //     console.log(res);
    //   }).catch((e) => {
    //     console.log(e);
    //   })
    //   console.log("this is summary")
    // }
    // function analyzePage() {
    //   const pageContent = document.documentElement.innerHTML;
    //   // console.log(pageContent)
    //   return pageContent;
  }

  function extractContentAndHTML() {
    const bodyCopy = document.body.cloneNode(true);

    const styleElements = bodyCopy.querySelectorAll('style');
    styleElements.forEach(styleElement => {
      styleElement.remove();
    });

    const allElements = bodyCopy.querySelectorAll('*');
    allElements.forEach(element => {
      element.removeAttribute('class');
      element.removeAttribute('style');
    });

    const content = bodyCopy.textContent;
    const html = bodyCopy.innerHTML;

    return content;
  }

  const getValidLengthText = (text) => {
    const validLength = 4 * 3200;
    return text.substr(0, validLength)
  }

  // function extractContentSections() {
  //   const sections = [];

  //   // Find all heading elements (you can adjust this based on your desired sections)
  //   const headings = document.querySelectorAll('h1, h2, h3');

  //   headings.forEach((heading, index) => {
  //     const section = {
  //       title: heading.textContent,
  //       content: '',
  //     };

  //     let currentNode = heading.nextSibling;
  //     while (currentNode && !currentNode.matches('h1, h2, h3')) {
  //       section.content += currentNode.textContent || '';
  //       currentNode = currentNode.nextSibling;
  //     }

  //     sections.push(section);
  //   });

  //   return sections;
  // }


  function removeWideSpaces(content) {
    return content.replace(/\s+/g, ' ').trim();
  }

  async function sendToExpressServer(validText) {
    const serverUrl = 'http://localhost:3000/make-openai-request';

    const requestData = {
      text: validText,
    };

    try {
      const res = fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }).then(res => {
        console.log(res.text())
        chrome.runtime.sendMessage(res.text())
        console.log("mesage sent")
      })
        .catch(error => console.log('error', error));

      console.log("response ")
      console.log(res)


      if (res.ok) {
        responseTxt = await res.body
        console.log(responseTxt)
        console.log('Text sent to Express server successfully.');
        return responseTxt
      } else {
        console.error('Failed to send text to Express server.');
      }
    } catch (error) {
      console.error('Error sending text to Express server:', error);
    }
  }

  async function generateSummary(content) {

    // const textContent = content.replace(/<\/?[^>]+(>|$)/g, "");
    // const normalizedTextContent = textContent.trim().replace(/\s+/g, " ");
    // console.log("List of the webpage content")
    // console.log(content)
    // Implement your summary generation logic here
    // This can involve text analysis, summarization libraries, etc.
    // Return the generated summary

    // const cont = textContent + "Give me the short summary of the content"

    console.log("generating summary")

    const requestData = {
      "model": 'gpt-3.5-turbo',
      "messages": [{
        "role": "user", "content": `Think step by step and provide a clear, concise, yet comprehensive summary of the provided content. Your task is to distil the content into a structured written format, using markdown for readability and organization. 

      In your summary, please ensure to:

      1. **Include the content's main title**: This will set the context and provide an idea about the content, if available.
      2. **Identify and summarize the key points/highlights**: List out the primary points, arguments, discoveries, or themes presented in the content. Consider these as the "need-to-know" points for understanding the content's core message/content.
      3. **Provide detail without losing clarity**: After the key points, provide a more detailed summary. Include significant sub-points, illustrative examples, discussions, and any conclusions or implications. Aim for this detailed section to complement and expand on the key points, but ensure it remains digestible and clear.
      4. **Structure your summary with markdown**: Use headers for different sections (e.g., Key Points, Detailed Summary), bullet points for listing items, bold or italic text for emphasis, and tables where appropriate.
      5. **Capture the content's essence without unnecessary length**: Strive for a balance of detail and brevity. Capture all the necessary information, but avoid overly long sentences and excessive detail.
      
      Remember, the goal is to ensure that someone who reads your summary will gain a complete and accurate understanding of the content, even if they haven't watched it themselves.
      If the content includes visual elements crucial to its understanding (like a graph, diagram, or scene description), please describe it briefly within the relevant part of the summary.

      Here's a template to guide your summary:
      # [title]

      ## TLDR
      (Provide a short summary of the content in a maximum of 3 sentences)

      ## Key Points/Highlights
      - Main Point/Highlight 1
      - Main Point/Highlight 2
      - ...

      ## Detailed Summary
      (Expand on the key points with sub-points, examples, discussions, conclusions or implications)

      ## Conclusion
      (Any conclusions made in the content, the final thoughts of the speaker, etc.)` +
          `The content is as follows: ${content}`
      }],

      temperature: 0.7,
      max_tokens: 300,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    }

    console.log("gathering response")

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData)
    })
    const data = await res.json()

    return data
    // return "This is a sample summary of the page content.";
  }

  getCurrentTab()
  console.log("outside")
  console.log(summary)
})