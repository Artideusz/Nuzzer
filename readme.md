#Nuzzer - A simple URL Fuzzer for Node.js

? - Optional

urlOpt(< url >) - Converts a URL into an option Object for http, https requests.

requestHEAD(< url >) - sends a HEAD request to a URL (Option Object is automatically included) and returns a Promise that resolves to an Object with the link and the status. 

fetchWords(< url >, < fast? >) - returns a Promise that resolves to an Array of words from the words.txt file and concatenates them with the url. Fast param cuts the array by 4 when true

createJSONList(< Array >, < url >) - returns an Object with http Statuses of the fuzz.

async fuzz1(< Object{ url, time?, fast? } >) - Fuzzes a link; request is sent time? Param(in ms). Fast param cuts the array by 4 when true.