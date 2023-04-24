import { createServiceTester } from '../tester.js'

export const t = await createServiceTester()

t.create('Build status (private application)')
  .get('/artifactory/v/pypi/foo?server=https://my.artifactory.net/artifactory/')
  .intercept(nock =>
    nock('https://my.artifactory.net/artifactory/')
      .get('/api/storage/pypi/foo')
      .reply(200, {
        results: [
          {
            uri: 'unused',
            children: [
              {
                uri: '/1.0.3',
                folder: true,
              },
              {
                uri: '/0.9.5',
                folder: true,
              },
            ],
          },
        ],
      })
  )
  .expectBadge({ label: 'foo', message: 'v1.0.3' })
