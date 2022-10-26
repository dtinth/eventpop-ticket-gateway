import axios from 'axios'
import { NowRequest, NowResponse } from '@vercel/node'
import querystring from 'querystring'
import * as jwt from 'jsonwebtoken'
import * as jose from 'jose'
import crypto from 'crypto'

const privateKey = Buffer.from(
  process.env.JWT_SIGNING_SECRET!,
  'base64'
).toString()

const publicKeyObject = crypto.createPublicKey(privateKey)

const baseUrl = process.env.GATEWAY_URL || `https://${process.env.VERCEL_URL}`

export default async (request: NowRequest, response: NowResponse) => {
  if (request.query.command === 'redirect') {
    const url =
      'https://www.eventpop.me/oauth/authorize?' +
      [
        `client_id=${process.env.EVENTPOP_CLIENT_ID}`,
        `redirect_uri=${encodeURIComponent(
          process.env.EVENTPOP_REDIRECT_URL!
        )}`,
        `response_type=code`,
      ].join('&')
    response.redirect(url)
  } else if (request.query.command === 'getTokens') {
    const eventId = +request.body.eventId
    const code = String(request.body.code)
    const target = String(request.body.target)
    if (!eventId) {
      return response.status(400).json({ error: { message: 'No event ID' } })
    }
    if (!code) {
      return response.status(400).json({ error: { message: 'No code' } })
    }
    const idTokens = await authenticateWithEventpopAuthorizationCode(
      eventId,
      code,
      target
    )
    response.status(200).json({ idTokens })
  } else if (request.query.command === 'openid-configuration') {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.status(200).json({
      id_token_signing_alg_values_supported: ['RS256'],
      issuer: baseUrl,
      jwks_uri: baseUrl + '/.well-known/jwks.json',
      response_types_supported: ['id_token'],
      subject_types_supported: ['public'],
    })
  } else if (request.query.command === 'jwks') {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.status(200).json({
      keys: [{ ...(await jose.exportJWK(publicKeyObject)), kid: 'e' }],
    })
  } else {
    response.status(200).send(`Hello!`)
  }
}

async function authenticateWithEventpopAuthorizationCode(
  eventId: number,
  code: string,
  target: string
): Promise<{ profile: ProfileData; idToken: string }[]> {
  const accessToken = await getAccessTokenFromEventpop(code)
  const profiles = await getProfilesFromEventpop(eventId, accessToken)
  return Promise.all(
    profiles.map(async (profile) => {
      const token = await mintUserToken(profile, target)
      return {
        profile,
        idToken: token,
      }
    })
  )
}

async function getAccessTokenFromEventpop(code: string): Promise<string> {
  const tokenResponse = await axios
    .post(
      'https://www.eventpop.me/oauth/token',
      querystring.stringify({
        client_id: process.env.EVENTPOP_CLIENT_ID,
        client_secret: process.env.EVENTPOP_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.EVENTPOP_REDIRECT_URL,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    .catch(handleNetworkError('Getting access token'))
  const accessToken = tokenResponse.data.access_token
  if (typeof accessToken !== 'string') {
    throw new Error('Did not get an access token')
  }
  return accessToken
}

async function getProfilesFromEventpop(
  eventId: number,
  accessToken: string
): Promise<ProfileData[]> {
  const ticketResponse = await axios
    .get('https://www.eventpop.me/api/public/organizers/1017/tickets', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
      params: {
        q: JSON.stringify({ event_id: +eventId }),
      },
    })
    .catch(handleNetworkError('Getting access token'))
  const tickets = ticketResponse.data.tickets
  if (!Array.isArray(tickets)) {
    throw new Error('Resulting tickets is not an array, got ' + typeof tickets)
  }
  return tickets.map(
    (ticket): ProfileData => ({
      ticketId: ticket.id,
      eventId: ticket.event_id,
      firstname: ticket.firstname,
      lastname: ticket.lastname,
      email: ticket.email,
      referenceCode: ticket.reference_code,
      ticketType: ticket.ticket_type?.name,
    })
  )
}

type ProfileData = {
  eventId: string
  ticketId: string
  firstname: string
  lastname: string
  email: string
  referenceCode: string
  ticketType: string
}

function handleNetworkError(action: string) {
  return (error: Error) => {
    const data = (error as any).response?.data
    if (data) {
      console.error('Error response:', data)
    }
    error.message = 'Failed to ' + action + ': ' + error.message
    throw error
  }
}

function mintUserToken(profile: ProfileData, target: string) {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      {
        iss: baseUrl,
        aud: target,
        ...profile,
        target,
      },
      privateKey,
      { algorithm: 'RS256', expiresIn: '10h', keyid: 'e' },
      (err, token) => {
        if (err) {
          reject(err)
        } else {
          resolve(token!)
        }
      }
    )
  })
}
