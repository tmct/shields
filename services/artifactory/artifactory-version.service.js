import semver from 'semver'
import Joi from 'joi'
import { BaseJsonService, NotFound } from '../index.js'
import { optionalUrl } from '../validators.js'
import { renderVersionBadge } from '../version.js'

const schema = Joi.object({
  children: Joi.array()
    .items(
      Joi.object({
        uri: Joi.string().required(),
        folder: Joi.bool().required(),
      })
    )
    .required(),
}).required()

const queryParamSchema = Joi.object({
  server: optionalUrl.required(),
}).required()

export default class ArtifactoryVersionService extends BaseJsonService {
  static category = 'version'

  static route = {
    base: 'artifactory/v',
    pattern: ':repo/:packageName',
    queryParamSchema,
  }

  static examples = [
    {
      title: 'Artifactory package version (latest semver)',
      namedParams: { repo: 'pypi-foo', packageName: 'bar' },
      queryParams: { server: 'http://myjfrog.acme.org/artifactory/' },
      staticPreview: this.render({ version: '1.0.0' }),
    },
  ]

  static defaultBadgeData = { label: 'artifactory version' }

  static render({ version }) {
    return renderVersionBadge({ version })
  }

  async handle({ repo, packageName }, { server }) {
    // TODO probably needs auth
    const json = await this._requestJson({
      schema,
      url: `${server}/api/storage/${repo}/${packageName}`,
      errorMessages: {
        404: 'package not found',
      },
    })

    const versions = []
    for (const child of json.children) {
      const packageVersion = child.uri.slice(1)
      if (semver.valid(packageVersion)) {
        versions.push(packageVersion)
      }
    }

    if (!versions.length) {
      throw new NotFound({ prettyMessage: 'no versions found' })
    }

    const latestSemver = semver.maxSatisfying(versions, '*')

    return this.constructor.render({ version: latestSemver })
  }
}
