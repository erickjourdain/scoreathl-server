import { forEach } from 'lodash'

export default async (models) => {
  const epreuves = await models.Epreuve.find()
  const score = {
    points: 0,
    resultats: []
  }
  forEach(epreuves, epreuve => {
    score.resultats.push({
      epreuve: epreuve._id,
      resultat: [],
      score: 0
    })
  })
  return models.Score.create(score)
}