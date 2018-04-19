import * as http from 'http';
import { Stream } from 'stream';
import { WriteStream } from 'fs';

const server = http.createServer(handler);

const peeps = {
  '1': {
    name: 'Theo',
    age: 23,
  },
  '2': {
    name: 'Ellie',
    age: 23,
  },
  '3': {
    name: 'Jon',
    age: 24,
  },
  '4': {
    name: 'Suzy',
    age: 23,
  },
};

function handler(req: http.ServerRequest, res: http.ServerResponse) {
  let method = req.method;
  let url = req.url;
  mux(method, url, res, req);
}

async function mux(
  method: string,
  url: string,
  res: http.ServerResponse,
  req: http.ServerRequest
) {
  switch (method) {
    case 'GET':
      httpGet(url, res);
      break;
    case 'POST':
      await httpPost(url, req, res);
      break;
    default:
      res.writeHead(404, 'Not implemented');
      break;
  }
  res.end();
  return;
}

function httpPost(
  url: string,
  req: http.ServerRequest,
  res: http.ServerResponse
) {
  return new Promise((resolve, reject) => {
    let path = url.substr(1);
    if (peeps[path]) {
      let t = new Template('<p>A person with that id already exists.</p>');
      t.write(res);
      reject();
    }
    let body = [];
    let bodyString = '';
    req
      .on('data', buf => {
        body.push(buf);
        bodyString = Buffer.concat(body).toString();
        let json = JSON.parse(bodyString);
        peeps[path] = {
          name: json.name,
          age: json.age,
        };
        let response = new Template(
          `
          <p>Added ${json.name}...</p>
        `,
          'Added ' + json.name
        );
        response.write(res);
      })
      .on('end', () => {
        resolve();
      });
  });
}

function httpGet(url: string, res: http.ServerResponse) {
  let path = url.substr(1);
  let p = peeps[path];
  let t = new Template(
    `
    <h2>${p.name}</h2>
    <p>${p.age}</p>
  `,
    'Nodeland'
  );
  res.writeHead(200, { 'Content-Type': 'text/html' });
  t.write(res);
}

server.on('close', () => {
  console.log('Server closed.');
});

server.listen(3000, 'localhost', undefined, () => {
  console.log('Listening on 3000');
});

function Template(innerHTML: string, title?: string) {
  this.innerHTML = innerHTML;
  this.outerHTML = `
  <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Doing some node.'}</title>
        <meta charset="utf8"/>
      </head>
      <body>
        ${this.innerHTML}
        <div>All People</div>
          <pre>
${JSON.stringify(peeps, undefined, 2)}
          </pre>
      </body>
    </html>
  `;
}

Template.prototype.write = function(res: http.ServerResponse) {
  res.write(this.outerHTML, () => {
    console.log('Responded');
  });
  return;
};
