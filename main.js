const fsp = require('fs').promises;
const https = require('https')
const repos = require('./repos.json')

async function main() {
  const result = []
  for (const repo of repos) {
    const repoData = await request(repo)
    result.push(new Repo(repoData))
  }
  await write(rankByStars(result))
}

main().then(_ => console.log('Done.'))


// Helper functions

function request(repo) {
  const options = {
    hostname: 'api.github.com',
    path: '/repos/' + repo.path,
    method: 'GET',
    headers: {
      'Authorization': `token ${process.env.GTOKEN}`,
      'Content-Type': 'application/json',
      'user-agent': 'node.js',
    }
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.setEncoding('utf8')
      let resBody = ''
      res.on('data', (chunk) => {
        resBody += chunk
      })
      res.on('end', () => {
        resolve(JSON.parse(resBody))
      })
    })
    req.on('error', (err) => {
      console.log(err.name)
      console.log(err.message)
      reject(err)
    })
    req.end();
  })
}

function rankByStars(repos) {
  return repos.sort((a, b) => a.stargazers_count - b.stargazers_count).reverse()
}

async function write(sortedRepos) {
  let data = `# Top Node.js Web Frameworks\n\n[![update](https://github.com/sunnysid3up/nodejs-web-frameworks/actions/workflows/update.yml/badge.svg)](https://github.com/sunnysid3up/nodejs-web-frameworks/actions/workflows/update.yml)\n\nA list of popular Node.js web frameworks ranked by the number of GitHub stars, automatically updated every week.\n\nLast update: ${new Date().toISOString()}

| Name          | Description          | Stars                     | Forks          | Issues               | First Commit        | Last Commit         | Language          |
|---------------|----------------------|---------------------------|----------------|----------------------|---------------------|---------------------|-------------------|`
  for (const repo of sortedRepos) {
    const language = repo.language === "TypeScript" ? "TS" : "JS"
    data += `\n| [${repo.name}](${repo.html_url}) | ${repo.description} | ${repo.stargazers_count} | ${repo.forks} | ${repo.open_issues} | ${repo.created_at} | ${repo.updated_at} | ${language} |`
  }
  data += `\n\n## Contribute \n\nCreate an issue or pull request if you would like to add more frameworks :)`
  await fsp.writeFile('README.md', data)
  console.log("Updated README.")
}


// Struct

function Repo(data) {
  this.name = data.name
  this.description = data.description
  this.html_url = data.html_url
  this.stargazers_count = data.stargazers_count
  this.forks = data.forks
  this.open_issues = data.open_issues
  this.language = data.language
  this.created_at = new Date(data.created_at).getFullYear()
  this.updated_at = data.updated_at.split("T")[0]
}
