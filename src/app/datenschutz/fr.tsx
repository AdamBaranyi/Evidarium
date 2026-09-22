import { Betreiber } from '../_teile/textseite';
import { env } from '@/lib/config/env';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';

/* La déclaration de protection des données en français — traduction ; seul l’allemand fait foi. */
export function DatenschutzFr({ live }: { live: boolean }) {
  return (
    <>
      <p>
        Cette page indique quelles données Evidarium traite, dans quel but, à qui elles sont
        communiquées et quand elles sont effacées. La loi suisse sur la protection des données
        s’applique.
      </p>

      <h2>Responsable</h2>
      <Betreiber
        name={env.BETREIBER_NAME}
        adresse={env.BETREIBER_ADRESSE}
        email={env.BETREIBER_EMAIL}
      />

      <h2>Ce qui ne se produit pas</h2>
      <ul>
        <li>Pas de publicité, pas d’outils d’analyse, pas de pistage.</li>
        <li>
          Aucune requête vers des serveurs tiers lors de l’affichage de la page&nbsp;; les polices
          sont hébergées ici aussi.
        </li>
        <li>Aucune vente et aucune transmission à d’autres fins.</li>
      </ul>

      <h2>Hébergement et journaux du serveur</h2>
      <p>
        Evidarium fonctionne sur un serveur propre chez FSIT (fsit.ch) en Suisse. FSIT fournit la
        machine et traite les données sur mon mandat.
      </p>
      <p>
        À chaque appel, le serveur enregistre des données techniques&nbsp;: adresse IP, date et
        heure, adresse appelée, code d’état, volume transféré et identification du navigateur. C’est
        nécessaire pour livrer la page, trouver les erreurs et repousser les attaques. Les données
        ne sont pas croisées avec d’autres et sont effacées après 14&nbsp;jours.
      </p>

      <h2>Langue</h2>
      <p>
        Si vous choisissez une langue en haut de la page, un cookie «&nbsp;evidarium_sprache&nbsp;»
        la mémorise pendant un an. Il ne contient que le code de la langue. Sans choix de votre
        part, la langue suit les réglages de votre navigateur, et aucun cookie n’est créé.
      </p>

      <h2>Démo publique</h2>
      <ul>
        <li>
          <strong>Cookie</strong> «&nbsp;evidarium_demo&nbsp;», 30&nbsp;jours&nbsp;: compte les
          questions par visite. Seule une valeur de hachage en est enregistrée, pas la valeur
          elle-même. Le cookie est techniquement nécessaire à la limitation&nbsp;; il n’y a donc pas
          de demande de consentement.
        </li>
        <li>
          <strong>Adresse IP</strong>, uniquement sous forme de hachage, pour la limite par
          provenance et par jour. Le hachage est retiré après 24&nbsp;heures.
        </li>
        <li>
          <strong>Vos fichiers</strong>&nbsp;: le fichier, le texte lu et les vecteurs de recherche
          se trouvent sur le serveur et sont effacés automatiquement après {DEMO_GRENZEN.stunden}
          &nbsp;heures. Les autres visiteurs ne les voient pas. Ne téléversez pas de documents
          confidentiels ou personnels.
        </li>
      </ul>

      <h2>Comptes</h2>
      <p>
        L’exploitant crée les comptes à la main. Sont enregistrés l’adresse e-mail et une empreinte
        du mot de passe (Argon2id), jamais le mot de passe. Une connexion dure sept jours grâce à un
        cookie techniquement nécessaire. Les connexions échouées sont comptées par provenance,
        uniquement sous forme de hachage.
      </p>
      <p>
        Les documents téléversés et les noms des projets dans lesquels vous les classez restent
        enregistrés jusqu’à ce que vous les supprimiez.{' '}
        <strong>Les questions et les réponses ne sont pas enregistrées</strong> — une conversation
        n’existe que tant que la page est ouverte.
      </p>

      {live && (
        <>
          <h2>Réponses via une interface</h2>
          <p>
            Les fichiers sont lus et recherchés sur le serveur&nbsp;; des fichiers entiers ne le
            quittent jamais. Pour une réponse, la question et les passages trouvés, huit au plus,
            sont transmis à Anthropic PBC, San Francisco, États-Unis. Anthropic les traite en tant
            que sous-traitante uniquement pour produire la réponse. Il s’agit d’une communication à
            l’étranger.
          </p>
        </>
      )}

      <h2>Contact par e-mail</h2>
      <p>
        L’adresse de contact renvoie vers ma boîte chez Apple iCloud. Apple traite des données en
        Irlande et aux États-Unis, pour les États-Unis sur la base de clauses contractuelles types.
        Je conserve les messages aussi longtemps que la demande l’exige.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander à accéder à vos données personnelles, faire rectifier des données
        inexactes et faire effacer des données, pour autant qu’aucune obligation de conservation ne
        s’y oppose. Écrivez pour cela à l’adresse indiquée plus haut.
      </p>
    </>
  );
}
