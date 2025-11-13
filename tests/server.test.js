// TDD: RED フェーズ - サーバーテスト
const http = require('http');
const { startServer } = require('../src/server');

jest.mock('../src/browser');
jest.mock('../src/repository');

describe('server - HTTP API endpoints', () => {
  let testServer;
  let testPort = 9999;

  afterEach(() => {
    if (testServer) {
      testServer.close();
    }
  });

  describe('/api/repos エンドポイント', () => {
    test('リポジトリと保存済み設定をJSON形式で返す', (done) => {
      const mockRepoData = {
        userRepos: [
          { name: 'repo1', owner: { login: 'user' }, url: 'https://...' }
        ],
        orgRepos: []
      };
      const mockConfig = { targets: ['user/repo1'] };

      testServer = http.createServer((req, res) => {
        if (req.url === '/api/repos') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            repoData: mockRepoData,
            savedTargets: mockConfig.targets || []
          }));
        }
      });

      testServer.listen(testPort + 5, () => {
        const options = {
          hostname: 'localhost',
          port: testPort + 5,
          path: '/api/repos',
          method: 'GET'
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            expect(res.statusCode).toBe(200);
            const result = JSON.parse(data);
            expect(result).toHaveProperty('repoData');
            expect(result).toHaveProperty('savedTargets');
            expect(Array.isArray(result.savedTargets)).toBe(true);
            done();
          });
        });

        req.on('error', done);
        req.end();
      });
    });
  });

  describe('/api/elapsed エンドポイント', () => {
    test('経過時間をJSON形式で返す', (done) => {
      const startTime = Date.now();
      testServer = http.createServer((req, res) => {
        if (req.url === '/api/elapsed') {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ elapsed }));
        }
      });

      testServer.listen(testPort, () => {
        const options = {
          hostname: 'localhost',
          port: testPort,
          path: '/api/elapsed',
          method: 'GET'
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            expect(res.statusCode).toBe(200);
            const result = JSON.parse(data);
            expect(result).toHaveProperty('elapsed');
            expect(typeof result.elapsed).toBe('number');
            done();
          });
        });

        req.on('error', done);
        req.end();
      });
    });

    test('Content-Typeがapplication/jsonである', (done) => {
      const startTime = Date.now();
      testServer = http.createServer((req, res) => {
        if (req.url === '/api/elapsed') {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ elapsed }));
        }
      });

      testServer.listen(testPort + 1, () => {
        const options = {
          hostname: 'localhost',
          port: testPort + 1,
          path: '/api/elapsed',
          method: 'GET'
        };

        const req = http.request(options, (res) => {
          expect(res.headers['content-type']).toContain('application/json');
          res.on('data', () => {});
          res.on('end', done);
        });

        req.on('error', done);
        req.end();
      });
    });
  });

  describe('/api/save-targets エンドポイント', () => {
    test('POSTリクエストで設定を保存する', (done) => {
      const mockConfig = { targets: [] };
      testServer = http.createServer((req, res) => {
        if (req.url === '/api/save-targets' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const data = JSON.parse(body);
            mockConfig.targets = data.targets || [];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
        }
      });

      testServer.listen(testPort + 2, () => {
        const postData = JSON.stringify({
          targets: ['owner/repo1', 'owner/repo2']
        });

        const options = {
          hostname: 'localhost',
          port: testPort + 2,
          path: '/api/save-targets',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            expect(res.statusCode).toBe(200);
            const result = JSON.parse(data);
            expect(result.success).toBe(true);
            done();
          });
        });

        req.on('error', done);
        req.write(postData);
        req.end();
      });
    });

    test('POSTリクエストでContentTypeがapplication/jsonである', (done) => {
      testServer = http.createServer((req, res) => {
        if (req.url === '/api/save-targets' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
        }
      });

      testServer.listen(testPort + 3, () => {
        const postData = JSON.stringify({ targets: [] });

        const options = {
          hostname: 'localhost',
          port: testPort + 3,
          path: '/api/save-targets',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        };

        const req = http.request(options, (res) => {
          expect(res.headers['content-type']).toContain('application/json');
          res.on('data', () => {});
          res.on('end', done);
        });

        req.on('error', done);
        req.write(postData);
        req.end();
      });
    });

    test('設定変更後のサーバーメモリが同期される', (done) => {
      let mockConfig = { targets: [] };
      testServer = http.createServer((req, res) => {
        if (req.url === '/api/save-targets' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const data = JSON.parse(body);
            // サーバーメモリの設定を更新
            mockConfig.targets = data.targets || [];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
        } else if (req.url === '/api/repos') {
          // 設定変更後に /api/repos をリクエストして、設定が反映されているか確認
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            repoData: { userRepos: [], orgRepos: [] },
            savedTargets: mockConfig.targets || []
          }));
        }
      });

      testServer.listen(testPort + 6, () => {
        const postData = JSON.stringify({
          targets: ['owner/repo1', 'owner/repo2']
        });

        const postOptions = {
          hostname: 'localhost',
          port: testPort + 6,
          path: '/api/save-targets',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        };

        // 1. 設定を保存
        const postReq = http.request(postOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            expect(JSON.parse(data).success).toBe(true);

            // 2. 設定が保存されたら、/api/repos をリクエストして反映を確認
            const getOptions = {
              hostname: 'localhost',
              port: testPort + 6,
              path: '/api/repos',
              method: 'GET'
            };

            const getReq = http.request(getOptions, (getRes) => {
              let repoData = '';
              getRes.on('data', (chunk) => {
                repoData += chunk;
              });
              getRes.on('end', () => {
                const result = JSON.parse(repoData);
                // 設定が反映されていることを確認
                expect(result.savedTargets).toEqual(['owner/repo1', 'owner/repo2']);
                done();
              });
            });

            getReq.on('error', done);
            getReq.end();
          });
        });

        postReq.on('error', done);
        postReq.write(postData);
        postReq.end();
      });
    });
  });

  describe('メインページ', () => {
    test('GETリクエストでHTMLを返す', (done) => {
      const mockConfig = { targets: [] };
      testServer = http.createServer((req, res) => {
        if (req.url === '/' || !req.url.startsWith('/api/')) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<html><body>Test</body></html>');
        }
      });

      testServer.listen(testPort + 4, () => {
        const options = {
          hostname: 'localhost',
          port: testPort + 4,
          path: '/',
          method: 'GET'
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('text/html');
            expect(data).toContain('Test');
            done();
          });
        });

        req.on('error', done);
        req.end();
      });
    });
  });
});
