import type { ChartMode, PlanetId } from './astroEngine';

/**
 * Corpus astrologique complet des 11 astres dans les 12 Maisons (132 combinaisons).
 * Chaque entrée décrit la manifestation psychologique et concrète de l'astre dans ce secteur.
 */
export const PLANET_IN_HOUSE_MEANINGS: Record<PlanetId, Record<number, string>> = {
  sun: {
    1: 'Soleil en Maison I : identité affirmée, vitalité rayonnante et besoin d’exister par ses propres choix. Vous abordez la vie de front avec franchise, charisme naturel et envie d’imprimer votre marque personnelle dès le premier contact.',
    2: 'Soleil en Maison II : la confiance en soi s’ancre dans la capacité à bâtir ses ressources, valoriser ses talents concrets et sécuriser son autonomie matérielle. Fierté saine liée à ce que vous produisez ou possédez durablement.',
    3: 'Soleil en Maison III : rayonnement par la parole, l’écriture, l’apprentissage et la mise en réseau. Esprit vif et curieux qui s’accomplit dans les échanges quotidiens, la pédagogie, la médiation ou les projets de proximité.',
    4: 'Soleil en Maison IV : le cœur de l’identité puise sa force dans les racines, la vie familiale, le patrimoine et le sanctuaire privé. Besoin essentiel d’un foyer lumineux, stable et fidèle à vos valeurs profondes.',
    5: 'Soleil en Maison V : placement solaire par excellence — créativité généreuse, joie de vivre, expression artistique, élans du cœur passionnés et fierté créatrice envers vos œuvres ou vos enfants.',
    6: 'Soleil en Maison VI : l’accomplissement passe par le travail quotidien maîtrisé, le sens du service utile, la compétence technique et la vitalité entretenue par une hygiène de vie structurée.',
    7: 'Soleil en Maison VII : l’identité se révèle pleinement dans le miroir du couple, des alliances et des engagements contractuels. Forte sensibilité à la justice relationnelle et recherche d’un partenariat rayonnant et égalitaire.',
    8: 'Soleil en Maison VIII : personnalité intense, lucide et résiliente, attirée par les vérités cachées, la psychologie profonde, la gestion des ressources partagées et la capacité à renaître plus forte après chaque métamorphose.',
    9: 'Soleil en Maison IX : soif d’horizons lointains, de sens philosophique, d’études supérieures ou de voyages formateurs. L’âme s’épanouit en élargissant sa vision du monde et en transmettant des convictions élevées.',
    10: 'Soleil en Maison X : vocation affirmée vers la réussite publique, les responsabilités et la reconnaissance sociale. Besoin d’exercer une autorité légitime et de laisser une trace professionnelle visible et respectée.',
    11: 'Soleil en Maison XI : épanouissement au sein des projets collectifs, des cercles d’amis choisis et des causes d’avenir. Votre lumière personnelle brille particulièrement lorsque vous fédérez un groupe autour d’un idéal humain.',
    12: 'Soleil en Maison XII : vie intérieure vaste, sensibilité subtile et besoin de ressourcement silencieux. Vous puisez votre force dans l’imagination créatrice, l’empathie désintéressée, l’art ou la quête spirituelle.',
  },
  moon: {
    1: 'Lune en Maison I : tempérament réceptif, intuitif et à fleur de peau. Vos humeurs se lisent spontanément sur votre visage, et votre premier réflexe face au monde passe par le ressenti affectif et l’empathie immédiate.',
    2: 'Lune en Maison II : la sérénité émotionnelle est intimement liée à la sécurité financière et au confort tangible. Variations possibles dans les rentrées ou dépenses selon l’état d’âme, avec un fort instinct pour préserver l’essentiel.',
    3: 'Lune en Maison III : sensibilité mentale fine, mémoire affective vive et besoin quotidien d’échanger avec ses proches. Les lectures, déplacements courts et discussions familiales ou fraternelles nourrissent votre équilibre.',
    4: 'Lune en Maison IV : la Lune chez elle — attachement profond au foyer, à l’histoire familiale, à la lignée maternelle et aux souvenirs d’enfance. Votre maison est votre refuge sacré et le socle de votre vitalité.',
    5: 'Lune en Maison V : vie affective chaleureuse, romanesque et spontanée. Grande fertilité imaginative et tendresse naturelle envers les enfants, les loisirs créatifs et les élans du cœur.',
    6: 'Lune en Maison VI : vous investissez votre sensibilité dans le soin concret aux autres, la qualité de l’ambiance au travail et l’écoute des rythmes du corps. La santé réagit directement à votre équilibre émotionnel.',
    7: 'Lune en Maison VII : besoin fort de complicité affective, de douceur et d’écoute mutuelle dans le couple. L’humeur suit souvent le climat relationnel, d’où l’importance d’alliances rassurantes et attentives.',
    8: 'Lune en Maison VIII : vie émotionnelle intense, secrète et dotée d’une intuition psychologique pénétrante. Attachements profonds et capacité instinctive à traverser les crises intimes pour guérir en profondeur.',
    9: 'Lune en Maison IX : cœur attiré par l’ailleurs, les cultures étrangères, les voyages ressourçants et les philosophies humanistes qui donnent un abri moral et du souffle à la sensibilité.',
    10: 'Lune en Maison X : sensibilité publique marquée, besoin d’exercer un métier porteur de sens humain ou en prise directe avec le public. La réputation et la vie professionnelle restent liées à votre ressenti intérieur.',
    11: 'Lune en Maison XI : attachement sincère à la famille d’âme, aux amitiés fidèles et aux causes collectives solidaires. Vous vous sentez en sécurité lorsque vous partagez vos idéaux au sein d’un cercle fraternel.',
    12: 'Lune en Maison XII : empathie profonde, réceptivité presque médiumnique aux ambiances subtiles et besoin vital de solitude régénérante. L’univers onirique, la musique ou la contemplation apaisent l’âme.',
  },
  mercury: {
    1: 'Mercure en Maison I : esprit alerte, curieux et expressif dès le premier contact. Vous observez, analysez et verbalisez vite ; besoin constant de mouvement intellectuel, de dialogue et d’autonomie d’opinion.',
    2: 'Mercure en Maison II : intelligence pratique tournée vers la gestion, le négoce, l’expertise technique ou la monétisation des idées, des écrits et du savoir-faire de communication.',
    3: 'Mercure en Maison III : Mercure dans son secteur naturel — aisance exceptionnelle pour apprendre, rédiger, négocier, enseigner et tisser des liens multiples dans l’environnement proche.',
    4: 'Mercure en Maison IV : réflexion nourrie par les souvenirs, l’histoire familiale et les échanges à la maison. Esprit analytique qui aime travailler au calme depuis son foyer ou explorer ses origines.',
    5: 'Mercure en Maison V : intellect ludique, créatif et spirituel ; goût des jeux d’esprit, de l’écriture littéraire, de l’enseignement vivant et de la séduction par l’humour et la conversation.',
    6: 'Mercure en Maison VI : Mercure en exaltation sectorielle — sens aigu de la méthode, de l’organisation, du diagnostic précis, de la santé et de l’amélioration continue des outils de travail.',
    7: 'Mercure en Maison VII : le dialogue est le ciment de vos relations. Vous êtes attiré par des partenaires vifs, cultivés et stimulants intellectuellement, avec un talent naturel pour le conseil et la négociation.',
    8: 'Mercure en Maison VIII : esprit investigateur qui ne s’arrête jamais à la surface des choses. Don pour la recherche, la psychologie, l’analyse financière complexe et la lecture des non-dits.',
    9: 'Mercure en Maison IX : curiosité philosophique, goût des langues étrangères, des études supérieures, du droit, de l’édition ou des grands voyages intellectuels à la recherche d’une synthèse globale.',
    10: 'Mercure en Maison X : carrière fondée sur la compétence intellectuelle, la communication, la stratégie, le journalisme, l’enseignement ou la coordination de projets publics exigeants.',
    11: 'Mercure en Maison XI : pensée moderne et reliée aux réseaux ; vous excellez dans l’échange d’idées novatrices avec vos amis, équipes, communautés et cercles de réflexion tournés vers le futur.',
    12: 'Mercure en Maison XII : mental intuitif, contemplatif et symbolique, travaillant souvent en silence ou dans les coulisses. Inspiration fertile par l’écriture intime, la psychologie ou la recherche solitaire.',
  },
  venus: {
    1: 'Vénus en Maison I : charme naturel, courtoisie spontanée et sens esthétique visible dans votre allure. Vous privilégiez l’harmonie, l’élégance et la conciliation dans votre manière d’aller vers la vie.',
    2: 'Vénus en Maison II : Vénus dans son secteur de prédilection — rapport aisé à la prospérité, goût des belles choses, talents artistiques ou relationnels capables d’attirer des ressources durables.',
    3: 'Vénus en Maison III : parole douce et diplomate, plaisir des échanges intellectuels agréables, écrits raffinés et relations chaleureuses avec la fratrie, le voisinage et les déplacements quotidiens.',
    4: 'Vénus en Maison IV : amour profond du foyer harmonieux, de la décoration soignée, de l’art de recevoir et de la paix familiale. Votre cœur s’épanouit dans un nid douillet et chaleureux.',
    5: 'Vénus en Maison V : fort magnétisme amoureux, créativité artistique joyeuse et goût raffiné des plaisirs de la vie. Capacité généreuse à aimer avec enthousiasme, tendresse et sens du jeu.',
    6: 'Vénus en Maison VI : recherche d’harmonie et de bienveillance dans le cadre de travail quotidien ; sens esthétique appliqué au savoir-faire artisanal, au soin, au bien-être ou aux services attentionnés.',
    7: 'Vénus en Maison VII : Vénus chez elle — quête sincère de partenariat équilibré, de tendresse réciproque, de vie à deux élégante et de talent naturel pour la médiation ou l’union durable.',
    8: 'Vénus en Maison VIII : sentiments profonds, magnétiques et passionnés qui transforment l’être en profondeur. Peut également favoriser les avantages financiers partagés, soutiens ou alliances de ressources.',
    9: 'Vénus en Maison IX : cœur idéaliste attiré par les horizons lointains, l’art universel, les voyages amoureux ou les partenaires d’une autre culture qui ouvrent votre vision du monde.',
    10: 'Vénus en Maison X : image publique séduisante et diplomate ; réussite facilitée dans les domaines artistiques, esthétiques, relationnels, diplomatiques ou par des appuis bienveillants dans la carrière.',
    11: 'Vénus en Maison XI : amitiés tendres, réseaux artistiques ou fraternels chaleureux et capacité à créer de l’entente au sein des groupes. L’amour se nourrit souvent d’une grande complicité amicale.',
    12: 'Vénus en Maison XII : amour romantique, compatissant et parfois secret ou idéalisé. Grande sensibilité artistique et capacité de don du cœur discret et désintéressé.',
  },
  mars: {
    1: 'Mars en Maison I : tempérament dynamique, franc, combatif et entreprenant. Vous possédez un fort élan d’initiative et préférez agir directement plutôt que subir ou temporiser.',
    2: 'Mars en Maison II : énergie conquérante appliquée à la réussite matérielle et à l’indépendance financière ; grand esprit d’entreprise pour gagner vos ressources, parfois avec des achats impulsifs à canaliser.',
    3: 'Mars en Maison III : intellect rapide, parole directe et parfois tranchante. Esprit vif dans les débats, besoin de mouvement quotidien, grande réactivité dans les démarches, écrits et déplacements.',
    4: 'Mars en Maison IV : énergie protectrice et active au sein du foyer ; besoin d’être maître chez soi et de bâtir sa sécurité par soi-même, en apprenant à apaiser les tensions familiales.',
    5: 'Mars en Maison V : passion ardente, audace créatrice, goût du sport, du défi et de la conquête amoureuse directe. Grande vitalité ludique et capacité à défendre vos projets personnels.',
    6: 'Mars en Maison VI : puissance de travail remarquable, efficacité technique, sens de l’effort quotidien et goût des défis concrets, en veillant à préserver le corps du surmenage.',
    7: 'Mars en Maison VII : intensité et franchise dans la vie de couple et les partenariats. Attirance pour des partenaires affirmés et dynamiques ; invite à transformer la rivalité en alliance combative.',
    8: 'Mars en Maison VIII : volonté d’acier, endurance stratégique et courage face aux situations critiques. Puissante énergie de régénération psychologique et de maîtrise dans les défis complexes.',
    9: 'Mars en Maison IX : ardeur intellectuelle et morale ; vous défendez vos convictions avec feu et aimez l’aventure, les voyages actifs, le sport au grand air ou les conquêtes universitaires et juridiques.',
    10: 'Mars en Maison X : forte ambition professionnelle, esprit de leadership et besoin d’atteindre des objectifs tangibles. Vous excellez dans les carrières exigeant prise de décision, audace et autonomie.',
    11: 'Mars en Maison XI : énergie mobilisée au service de projets collectifs, d’entreprises d’équipe ou de causes militantes. Vous aimez stimuler vos amis et lancer des initiatives de groupe audacieuses.',
    12: 'Mars en Maison XII : action souterraine, stratégique ou inspirée par une cause invisible. Apprendre à exprimer sereinement vos désirs et colères plutôt que de les retenir intérieurement.',
  },
  jupiter: {
    1: 'Jupiter en Maison I : présence chaleureuse, optimisme naturel et confiance communicative. Cette position amplifie l’envergure personnelle, la générosité et la capacité à attirer des occasions favorables.',
    2: 'Jupiter en Maison II : aisance potentielle pour développer vos revenus, attirer la prospérité et valoriser vos talents à grande échelle, à condition de garder mesure dans les dépenses.',
    3: 'Jupiter en Maison III : curiosité vaste, talent pédagogique, facilité à communiquer avec entrain et réussite dans l’enseignement, les médias, l’édition, le commerce ou les déplacements.',
    4: 'Jupiter en Maison IV : protection et chaleur autour du foyer, de la famille et du patrimoine immobilier. Sentiment intérieur de sécurité et accueil généreux au sein de votre lieu de vie.',
    5: 'Jupiter en Maison V : joie de vivre expansive, créativité abondante, chance dans les projets personnels, générosité amoureuse et épanouissement fécond dans la création ou l’éducation.',
    6: 'Jupiter en Maison VI : bienveillance dans le travail quotidien, sens de l’organisation élargie, facilité à trouver des améliorations pratiques utiles et soutien dans la vitalité et les collaborations.',
    7: 'Jupiter en Maison VII : chance et élargissement à travers les unions, les associations, le conseil juridique ou la clientèle. Attire souvent des partenaires généreux, cultivés ou porteurs d’ouverture.',
    8: 'Jupiter en Maison VIII : flair psychologique et financier, capacité à recevoir des appuis ou héritages constructifs et grande résilience morale transformant chaque épreuve en sagesse.',
    9: 'Jupiter en Maison IX : Jupiter dans sa propre demeure — appel fort des grands voyages, des études supérieures, de la philosophie, du droit ou de la transmission inspirée de vastes synthèses.',
    10: 'Jupiter en Maison X : élévation sociale et professionnelle favorisée, réputation honorable, sens de la vision à grande échelle et accès naturel à des postes d’envergure ou de direction.',
    11: 'Jupiter en Maison XI : soutien précieux venant des amitiés, des réseaux influents et des projets collectifs. Vos objectifs d’avenir prennent de l’ampleur grâce à un esprit fraternel et fédérateur.',
    12: 'Jupiter en Maison XII : protection intérieure subtile, grande compassion humaine et intuition spirituelle profonde. Le retrait méditatif, l’art ou l’aide humanitaire sont sources de paix féconde.',
  },
  saturn: {
    1: 'Saturne en Maison I : tempérament sérieux, digne, exigeant et autonome. Même si les débuts peuvent demander un effort de confiance en soi, vous bâtissez avec l’âge une autorité calme et inébranlable.',
    2: 'Saturne en Maison II : sens aigu de la prévoyance, gestion financière prudente et construction lente mais très solide du patrimoine. Apprend à fonder sa valeur personnelle au-delà des peurs matérielles.',
    3: 'Saturne en Maison III : pensée rigoureuse, concentrée et logique ; parole mesurée et fiable. Vous préférez la profondeur vérifiée au bavardage et excellez dans les études structurées.',
    4: 'Saturne en Maison IV : sens fort des responsabilités familiales et besoin d’édifier un socle domestique durable par vos propres efforts. Maturité émotionnelle conquise en pacifiant les racines.',
    5: 'Saturne en Maison V : créativité exigeante, amour fidèle et sérieux, parfois teinté de retenue au départ. L’expression personnelle devient magistrale lorsqu’elle s’autorise la joie sans autocritique.',
    6: 'Saturne en Maison VI : conscience professionnelle irréprochable, persévérance dans les tâches complexes et sens de la discipline corporelle. Capacité à maîtriser des savoir-faire techniques exigeants.',
    7: 'Saturne en Maison VII : vision grave et loyale de l’engagement ; recherche d’un couple solide, durable et responsable plutôt que de liens légers. Les alliances mûrissent et se renforcent avec le temps.',
    8: 'Saturne en Maison VIII : sang-froid face aux crises, gestion rigoureuse des finances partagées et endurance psychologique remarquable. Invitation à apprivoiser le lâcher-prise face au changement.',
    9: 'Saturne en Maison IX : quête de sagesse réaliste, rigueur philosophique ou juridique et persévérance dans les études longues. Vous ne croyez qu’à ce que vous avez éprouvé par l’expérience.',
    10: 'Saturne en Maison X : Saturne chez lui — ambition patiente, sens du devoir public et élévation professionnelle durable bâtie pierre après pierre sur la compétence et la crédibilité.',
    11: 'Saturne en Maison XI : peu d’amis mais des liens fidèles à toute épreuve ; sens des responsabilités dans les groupes et capacité à donner une structure concrète aux projets d’avenir.',
    12: 'Saturne en Maison XII : travail intérieur profond, discipline spirituelle ou artistique solitaire et grande capacité à affronter les épreuves silencieuses pour en extraire une sagesse sereine.',
  },
  uranus: {
    1: 'Uranus en Maison I : personnalité originale, libre, anticonformiste et magnétique. Besoin vital d’indépendance, d’authenticité et de tracer une voie singulière hors des cadres figés.',
    2: 'Uranus en Maison II : rapport atypique ou fluctuant à l’argent ; talents innovants, numériques ou indépendants capables de renouveler vos sources de revenus hors des schémas classiques.',
    3: 'Uranus en Maison III : esprit fulgurant, intuition immédiate des idées neuves et expression directe parfois surprenante. Attirance pour les sciences, les technologies de communication et les échanges vivifiants.',
    4: 'Uranus en Maison IV : foyer non conventionnel, déménagements possibles ou besoin de liberté dans la vie privée. Vous réinventez votre propre modèle familial avec indépendance.',
    5: 'Uranus en Maison V : créativité avant-gardiste, élans amoureux soudains et besoin d’espace personnel dans les romances et les loisirs. Goût des créations audacieuses et originales.',
    6: 'Uranus en Maison VI : besoin d’autonomie dans le rythme de travail, rejet des routines mécaniques et attirance pour les méthodes de pointe, l’ergonomie moderne ou les approches alternatives de santé.',
    7: 'Uranus en Maison VII : attirance pour des partenaires originaux et libres ; besoin impératif d’un couple respirant, égalitaire et non possessif qui laisse place à l’évolution de chacun.',
    8: 'Uranus en Maison VIII : intuitions fulgurantes sur les mécanismes humains, capacité à couper brusquement avec le passé obsolète et éveil rapide lors des grandes phases de transformation.',
    9: 'Uranus en Maison IX : pensée libre refusant les dogmes établis ; ouverture aux philosophies progressistes, aux sciences modernes, aux voyages imprévus et aux synthèses d’avant-garde.',
    10: 'Uranus en Maison X : parcours professionnel singulier, indépendant ou pionnier. Vous réussissez pleinement lorsque votre carrière laisse place à l’innovation, à la réforme ou à la liberté d’action.',
    11: 'Uranus en Maison XI : Uranus dans son secteur analogue — amitiés stimulantes et atypiques, adhésion à des réseaux visionnaires et engagement résolu pour les idées humanistes et le progrès collectif.',
    12: 'Uranus en Maison XII : éclairs d’intuition subconsciente, vie intérieure libre de tout conformisme et libération progressive de conditionnements anciens par une prise de conscience soudaine.',
  },
  neptune: {
    1: 'Neptune en Maison I : aura subtile, romanesque, empathique et perméable aux atmosphères. Grande sensibilité artistique ou spirituelle, demandant de poser des repères clairs face aux attentes d’autrui.',
    2: 'Neptune en Maison II : rapport idéaliste ou détaché à la matière ; chance financière liée aux arts, à l’imaginaire, au soin ou aux causes humaines, tout en veillant à garder une comptabilité rigoureuse.',
    3: 'Neptune en Maison III : pensée poétique, imagée et intuitive, captant les sous-entendus mieux que les chiffres secs. Talent naturel pour l’écriture évocatrice, la musique, la photographie ou l’écoute fine.',
    4: 'Neptune en Maison IV : profonde sensibilité aux ambiances familiales et aux mémoires ancestrales. Besoin d’un foyer calme, inspirant ou proche de l’eau, véritable havre de paix pour se ressourcer.',
    5: 'Neptune en Maison V : romantisme élevé, inspiration artistique abondante et quête d’un amour idéal. Capacité à sublimer les émotions par la création théâtrale, musicale, picturale ou poétique.',
    6: 'Neptune en Maison VI : vocation de service bienveillant, de soin holistique ou d’aide attentive au quotidien. Sensibilité fine du corps demandant un rythme doux et respectueux.',
    7: 'Neptune en Maison VII : idéalisation du couple et immense capacité de compassion envers le partenaire. Invite à allier tendresse fusionnelle et lucidité concrète dans les engagements.',
    8: 'Neptune en Maison VIII : intuition psychique très fine des mystères émotionnels, empathie guérisseuse face aux crises d’autrui et sensibilité particulière aux courants subtils de la psyché.',
    9: 'Neptune en Maison IX : soif d’absolu spirituel, fascination pour les cultures lointaines, les sagesses mystiques et les idéaux universels dépassant les frontières.',
    10: 'Neptune en Maison X : vocation inspirée par l’art, l’aide humaine, l’image, la création ou une cause idéale. La réussite sociale s’éclaire lorsqu’elle porte un message sensible et collectif.',
    11: 'Neptune en Maison XI : idéalisme fraternel fort, attirance pour les cercles artistiques ou humanitaires et grande sensibilité aux rêves collectifs, en choisissant des alliances sincères.',
    12: 'Neptune en Maison XII : Neptune dans sa maison naturelle — vie contemplative d’une grande richesse, intuition profonde, compassion universelle et inspiration puisée dans le silence ou le rêve.',
  },
  pluto: {
    1: 'Pluton en Maison I : intensité magnétique, regard pénétrant et force de caractère silencieuse. Vous traversez les étapes de la vie avec une grande capacité d’endurance et de renaissance personnelle.',
    2: 'Pluton en Maison II : rapport profond aux ressources et à l’indépendance financière ; capacité à reconstruire sa sécurité matérielle sur des bases puissantes en dépassant la peur de la perte.',
    3: 'Pluton en Maison III : intellect incisif et perçant qui va droit à l’essentiel. Parole influente, goût de l’enquête, de la psychologie ou de la recherche approfondie des faits cachés.',
    4: 'Pluton en Maison IV : lien intense avec la mémoire familiale et les transformations intimes de l’habitat ou de la lignée. Grand pouvoir de guérison des racines émotionnelles anciennes.',
    5: 'Pluton en Maison V : passion créatrice et amoureuse absolue ; besoin d’intensité sincère dans les élans du cœur et capacité à engendrer des œuvres marquantes et authentiques.',
    6: 'Pluton en Maison VI : puissance d’analyse clinique, capacité à diagnostiquer et réformer en profondeur les méthodes de travail, la technique ou l’hygiène de vie et de santé.',
    7: 'Pluton en Maison VII : les relations intimes agissent comme un puissant catalyseur de vérité et de transformation. Attire des liens passionnés qui invitent à dépasser les jeux de pouvoir pour atteindre la confiance totale.',
    8: 'Pluton en Maison VIII : Pluton dans son secteur naturel — lucidité psychologique hors norme, courage face aux grandes mutations de la vie et maîtrise des ressources partagées ou profondes.',
    9: 'Pluton en Maison IX : quête passionnée de vérité philosophique, remise en question radicale des certitudes superficielles et pouvoir de conviction transformateur dans l’enseignement ou les écrits.',
    10: 'Pluton en Maison X : ambition profonde, besoin d’exercer un impact réel dans sa carrière et capacité à se réinventer professionnellement avec autorité stratégique.',
    11: 'Pluton en Maison XI : influence forte au sein des réseaux, collectivités ou projets d’avenir ; amitiés rares mais transformatrices qui renouvellent profondément vos objectifs de vie.',
    12: 'Pluton en Maison XII : immense travail souterrain de l’inconscient, lucidité sur les mécanismes cachés de l’âme et pouvoir silencieux de résilience intérieure.',
  },
  northNode: {
    1: 'Nœud Nord en Maison I (Nœud Sud en VII) : chemin d’évolution invitant à cultiver l’autonomie, l’affirmation directe de soi et l’initiative personnelle, sans dépendre excessivement de l’approbation du partenaire.',
    2: 'Nœud Nord en Maison II (Nœud Sud en VIII) : invitation à bâtir votre propre sécurité matérielle, reconnaître votre valeur tangible et cultiver la simplicité sereine plutôt que de vivre dans l’intensité des crises ou dépendances.',
    3: 'Nœud Nord en Maison III (Nœud Sud en IX) : évolution par la curiosité concrète, l’écoute proche, la communication claire et les échanges quotidiens, en évitant de vous enfermer dans des certitudes théoriques lointaines.',
    4: 'Nœud Nord en Maison IV (Nœud Sud en X) : apprentissage de la tendresse intime, de l’enracinement familial et de la sécurité intérieure, en équilibrant l’ambition publique par une vie privée nourrie.',
    5: 'Nœud Nord en Maison V (Nœud Sud en XI) : invitation à oser la joie créatrice personnelle, le rayonnement du cœur et l’expression singulière, en sortant d’un retrait trop collectif ou impersonnel.',
    6: 'Nœud Nord en Maison VI (Nœud Sud en XII) : croissance par la discipline bienveillante du quotidien, le service concret, la clarté pratique et le soin du corps, afin d’ancrer vos intuitions dans le réel.',
    7: 'Nœud Nord en Maison VII (Nœud Sud en I) : chemin de vie tourné vers la coopération vraie, l’écoute de l’autre, la diplomatie et le partage égalitaire dans le couple et les alliances.',
    8: 'Nœud Nord en Maison VIII (Nœud Sud en II) : invitation à apprivoiser la confiance partagée, les transformations psychologiques profondes et le lâcher-prise sur la possession matérielle exclusive.',
    9: 'Nœud Nord en Maison IX (Nœud Sud en III) : élargissement nécessaire vers une vision globale, la philosophie de vie, les voyages formateurs et l’intuition supérieure au-delà de l’analyse de détail.',
    10: 'Nœud Nord en Maison X (Nœud Sud en IV) : appel à assumer pleinement votre vocation publique, vos responsabilités adultes et votre accomplissement social, en sortant du seul refuge familial.',
    11: 'Nœud Nord en Maison XI (Nœud Sud en V) : évolution féconde vers les projets collectifs, les amitiés électives et les idéaux humanistes partagés, en mettant votre créativité au service du groupe.',
    12: 'Nœud Nord en Maison XII (Nœud Sud en VI) : apprentissage de la confiance spirituelle, de la compassion intérieure, du repos créatif et du lâcher-prise face au perfectionnisme anxieux.',
  },
};

export function getPlanetInHouseMeaning(planetId: PlanetId, houseNum: number): string {
  const clamped = ((Math.round(houseNum) - 1 + 12) % 12) + 1;
  return PLANET_IN_HOUSE_MEANINGS[planetId]?.[clamped] ?? '';
}

const SYNASTRY_OVERLAY_HINTS: Record<number, string> = {
  1: 'cet astre du partenaire touche directement votre image, votre vitalité et votre manière spontanée d’être',
  2: 'cet astre stimule votre sentiment de valeur personnelle, vos talents et votre gestion des ressources matérielles',
  3: 'cet astre anime vos discussions quotidiennes, votre curiosité intellectuelle et votre complicité verbale',
  4: 'cet astre résonne avec votre intimité profonde, votre foyer, votre histoire affective et votre besoin de sécurité',
  5: 'cet astre réveille la séduction, le jeu, la créativité partagée et la joie romantique dans votre vie',
  6: 'cet astre s’inscrit dans l’organisation pratique du quotidien, les habitudes de vie et l’entraide concrète',
  7: 'cet astre active de plein fouet le miroir du couple, l’engagement contractuel et la complémentarité relationnelle',
  8: 'cet astre déclenche une forte intensité magnétique, une intimité profonde et des transformations psychologiques mutuelles',
  9: 'cet astre élargit vos horizons, vos voyages, vos convictions morales et votre quête commune de sens',
  10: 'cet astre soutient ou stimule votre ambition publique, votre image sociale et vos projets de réalisation durable',
  11: 'cet astre nourrit la complicité amicale, les projets d’avenir communs et l’ouverture à votre cercle social',
  12: 'cet astre touche votre inconscient, votre vie intérieure silencieuse et crée un lien subtil presque télépathique',
};

export function getPlanetInHouseModeContext(
  mode: ChartMode,
  planetId: PlanetId,
  planetName: string,
  ownHouseRoman: string,
  natalHouseNum: number,
  natalHouseRoman: string,
  natalHouseTitle: string
): string {
  const natalCore = getPlanetInHouseMeaning(planetId, natalHouseNum);
  const synHint = SYNASTRY_OVERLAY_HINTS[natalHouseNum] ?? '';

  switch (mode) {
    case 'natal':
      return natalCore;
    case 'solarReturn':
      return `En Maison ${natalHouseRoman} natale (${natalHouseTitle}), cet astre de Révolution Solaire réactive durant l’année anniversaire la dynamique suivante : ${natalCore.replace(/^[^:]+:\s*/, '')}`;
    case 'transits':
      return `Transit en Maison ${natalHouseRoman} natale (${natalHouseTitle}) : ${planetName} vient activer temporairement ce secteur de votre carte natale — ${natalCore.replace(/^[^:]+:\s*/, '')}`;
    case 'lunarReturn':
      return `Durant ce mois lunaire (Maison ${ownHouseRoman} RL), cet astre projette son élan sur votre Maison ${natalHouseRoman} natale (${natalHouseTitle}) : ${natalCore.replace(/^[^:]+:\s*/, '')}`;
    case 'progressions':
      return `En progression intérieure, ${planetName} mûrit dans votre Maison ${natalHouseRoman} natale (${natalHouseTitle}) : ${natalCore.replace(/^[^:]+:\s*/, '')}`;
    case 'synastry':
      return `Superposition de B dans votre Maison ${natalHouseRoman} (A · ${natalHouseTitle}) : ${synHint}. Lecture de fond : ${natalCore.replace(/^[^:]+:\s*/, '')}`;
    case 'composite':
      return `Dans la Maison ${natalHouseRoman} composite (${natalHouseTitle}), ${planetName} décrit comment la relation elle-même vit ce secteur : ${natalCore.replace(/^[^:]+:\s*/, '')}`;
    case 'comparative':
      return `Sur votre Maison ${natalHouseRoman} de base (${natalHouseTitle}), l’astre comparé met en résonance : ${natalCore.replace(/^[^:]+:\s*/, '')}`;
    case 'live':
      return natalCore;
    default:
      return natalCore;
  }
}
