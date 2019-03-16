import { map } from 'lodash'

export default {
  Score: {
    resultats: (score, args, { models }) => {
      return map(score.resultats, async resultat => {
        const epreuve = await models.Epreuve.findById(resultat.epreuve)
        return {
          resultat: resultat.resultat,
          score: resultat.score,
          statut: resultat.statut,
          epreuve
        }
      })
    }
  }
}