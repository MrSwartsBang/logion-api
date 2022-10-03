import { UUID } from "@logion/node-api";
import { AbstractTermsAndConditionsElement } from "./TermsAndConditions";
import { Iso3166Alpha2Code } from "../Country";
import { DateTime } from 'luxon';
import { Language } from "../Types";

export type LogionTransferredRightCode =
    "PER-PRIV"
    | "PER-PUB"
    | "COM-NOMOD"
    | "COM-MOD"
    | "EX"
    | "NOEX"
    | "WW"
    | "REG"
    | "NOTIME"
    | "TIME";

export type LogionTransferredRightDescription = {
    shortDescription: string
    description: string
}

export type LogionTransferredRight = { code: LogionTransferredRightCode } & LogionTransferredRightDescription;

export const logionLicenseItems: Record<LogionTransferredRightCode, Record<Language, LogionTransferredRightDescription>> = {
    "PER-PRIV": {
        "en": {
            shortDescription: "PERSONAL, PRIVATE USE ONLY",
            description:
                "Use the Underlying Asset for your personal use, exclusively in private spheres and so long as that " +
                "personal use is non-commercial, i.e. does not, directly or indirectly, result in compensation, " +
                "financial benefit or commercial gain, To the extent that such use is non-commercial and private, you " +
                "may use, reproduce, display and as necessary perform but not modify the Underlying Asset."
        },
        "fr": {
            shortDescription: "USAGE PERSONNEL PRIVE",
            description:
                "Usage de l’Actif Sous-jacent pour votre usage privé, exclusivement dans une sphère privée dès lors " +
                "que cet usage n’est pas de nature commerciale, c-à-d ne produit pas directement ou indirectement un " +
                "gain commercial, une contrepartie financière ou une compensation. Sous condition que l’usage soit " +
                "privé et non-commercial, vous pouvez utiliser, reproduire, représenter et le cas échéant exécuter " +
                "mais non modifier l’Actif Sous-jacent. Tous types et tous supports de reproduction/représentation et " +
                "exécution sont envisagés, connus ou inconnus, dès lors qu’ils sont compatibles avec l’usage dans la " +
                "sphère privée."
        },
    },
    "PER-PUB": {
        "en": {
            shortDescription: "PERSONAL, PRIVATE, AND PUBLIC USE",
            description:
                "Use the Underlying Asset for your personal use, both in private and public spheres and so long as that " +
                "personal use is non-commercial, i.e. does not, directly or indirectly, result in compensation, " +
                "financial benefit or commercial gain, Includes the right to display the Underlying Assets as a profile " +
                "picture or in the metaverse. To the extent that such use is non-commercial, you may use, reproduce, " +
                "display and as necessary perform but not modify the Underlying Asset."
        },
        "fr": {
            shortDescription: "USAGE PERSONNEL PRIVE ET PUBLIC",
            description:
                "Usage de l’Actif Sous-jacent pour votre usage privé, tant dans une sphère privée que publique, sous " +
                "condition que l’usage personnel n’est pas de nature commerciale. c-à-d ne produit pas directement ou " +
                "indirectement un gain commercial, une contrepartie financière ou une compensation. Comprend le droit " +
                "de représenter l’Actif Sous-jacent comme image de profil sur les réseaux sociaux et dans le métavers. " +
                "Sous condition que l’usage soit non-commercial, vous pouvez utiliser, reproduire, représenter et le " +
                "cas échéant exécuter mais non modifier l’Actif Sous-jacent. Tous types et tous supports de " +
                "reproduction/représentation et exécution sont envisagés, connus ou inconnus, dès lorsqu’ils ne sont " +
                "pas de nature commerciale. Comprend la possibilité de concéder des sous-licences du droit de " +
                "représentation à des tiers, telles les plateformes tierces."
        },
    },
    "COM-NOMOD": {
        "en": {
            shortDescription: "COMMERCIAL USE WITHOUT MODIFICATION",
            description:
                "Use the Underlying Asset for commercial use, i.e. directly or indirectly, results in compensation, " +
                "financial benefit or commercial gain and may include promoting, marketing, advertising, and selling. " +
                "Such commercial use includes the right to use, reproduce, display, distribute and as necessary perform, " +
                "but not modify the Underlying Asset. Commercial use also confers personal, private and public use of " +
                "the Underlying Asset. Includes the right to display the Underlying Asset as a profile picture, display " +
                "on products or services using the Underlying Asset, display on sold merchandise, display in a physical " +
                "or digital museum. Includes the right to sublicense such rights."
        },
        "fr": {
            shortDescription: "USAGE COMMERCIAL SANS MODIFICATION ",
            description:
                "Usage de l’Actif Sous-jacent pour usage commercial, c-à-d produisant directement ou indirectement " +
                "un gain commercial, une contrepartie financière ou une compensation et peut inclure la promotion, " +
                "le marketing, la publicité, la vente. Vous pouvez utiliser, reproduire, représenter, " +
                "communiquer/distribuer et le cas échéant exécuter mais non modifier l’Actif Sous-jacent. L’usage " +
                "commercial comprend l’usage privé et public de l’Actif Sous-jacent. Comprend le droit de " +
                "représenter l’Actif Sous-jacent comme image de profil sur les réseaux sociaux et dans le métavers. " +
                "Comprend la reproduction/représentation sur des produits ou des services utilisant l’Actif Sous-jacent, " +
                "la reproduction/représentation sur les produits de marchandising offerts en vente, la " +
                "reproduction/représentation dans un musée physique ou virtuel. Comprend la possibilité de concéder " +
                "des sous-licences. Tous types et tous supports de reproduction/représentation/exécution/communication/" +
                "distribution/diffusion sont envisagés, connus ou inconnus, sans limitation."
        },
    },
    "COM-MOD": {
        "en": {
            shortDescription: "COMMERCIAL USE WITH THE RIGHT TO MODIFY",
            description:
                "Use the Underlying Asset for commercial use, i.e. directly or indirectly, results in compensation, " +
                "financial benefit or commercial gain and may include promoting, marketing, advertising, and selling. " +
                "Such commercial use includes the right to use, reproduce, display, distribute and as necessary perform " +
                "and modify the Underlying Asset. Includes the right to adapt the Underlying Asset, i.e. to recast, " +
                "transform, translate or adapt, including in any form recognizably derived from the original and in so " +
                "doing create derivative works of art. Commercial use also confers personal, private and public use of " +
                "the Underlying Asset. Includes the right to display the Underlying Asset as a profile picture, display " +
                "on products or services using the Underlying Asset and/or its derivatives, display on sold merchandise, " +
                "display in a physical or digital museum. Includes the right to sublicense such rights."
        },
        "fr": {
            shortDescription: "USAGE COMMERCIAL AVEC DROIT DE MODIFICATION",
            description:
                "Usage de l’Actif Sous-jacent pour usage commercial, c-à-d produisant directement ou indirectement un " +
                "gain commercial, une contrepartie financière ou une compensation et peut inclure la promotion, le " +
                "marketing, la publicité, la vente. Vous pouvez utiliser, reproduire, représenter, communiquer/" +
                "distribuer et le cas échéant exécuter et modifier l’Actif Sous-jacent. Comprend le droit d’adaptation " +
                "de l’Actif Sous-jacent, c-à-d le droit de remanier, transformer, traduire ou adapter, inclusivement " +
                "sous toutes formes qui dérivent de l’original de manière marquée, créant de ce fait des œuvres d’art " +
                "dérivées. L’usage commercial comprend l’usage privé et public de l’Actif Sous-jacent. Comprend le " +
                "droit de représenter l’Actif Sous-jacent comme image de profil sur les réseaux sociaux et dans le " +
                "métavers. Comprend la reproduction/représentation sur des produits ou des services utilisant l’Actif " +
                "Sous-jacent, la reproduction/représentation sur les produits de marchandising offerts en vente, la " +
                "reproduction/représentation dans un musée physique ou virtuel. Comprend la possibilité de concéder " +
                "des sous-licences. Tous types et tous supports de reproduction/représentation/exécution/communication/" +
                "distribution/diffusion sont envisagés, connus ou inconnus, sans limitation."
        },
    },
    "EX": {
        "en": {
            shortDescription: "EXCLUSIVE USE",
            description:
                "The above-mentioned rights, as applicable, are exclusive in nature, i.e. are licensed and/or assigned " +
                "to no other person or entity."
        },
        "fr": {
            shortDescription: "USAGE EXCLUSIF",
            description:
                "Les droits mentionnés ci-dessus, selon qu’ils sont applicables, sont exclusifs, c'est à dire qu'ils " +
                "ne peuvent pas être donnés en licence et/ou cédés à aucune autre personne physique ou morale."
        },
    },
    "NOEX": {
        "en": {
            shortDescription: "NON-EXCLUSIVE USE",
            description:
                "The above-mentioned rights, as applicable, are non-exclusive in nature, i.e. they can be licensed " +
                "and/or assigned to other persons or entities."
        },
        "fr": {
            shortDescription: "USAGE NON-EXCLUSIF",
            description:
                "Les droits mentionnés ci-dessus, selon qu’ils sont applicables, ne sont pas exclusifs, c-à-d qu’ils " +
                "peuvent être donnés en licence et/ou cédés à d’autres personnes physiques ou morales."
        },
    },
    "WW": {
        "en": {
            shortDescription: "WORLDWIDE USE",
            description:
                "Covers use in all countries of the world, existing and future, not limited territorially."
        },
        "fr": {
            shortDescription: "USAGE MONDIAL",
            description:
                "Comprend tous les pays du monde, existants ou futurs, sans limitation territoriale. Est censé être " +
                "le plus extensif possible. Comprend l’usage sur l’internet, sur les réseaux sociaux, dans tous " +
                "mondes virtuels et dans tous métavers, connus ou inconnus. L’usage mondial ne devra pas être " +
                "sélectionné lorsqu’il s’agit d’un usage personnel et privé."
        },
    },
    "REG": {
        "en": {
            shortDescription: "COUNTRY-SPECIFIC OR REGIONAL USE",
            description:
                "Means that some territorial limitations apply. The list of allowed countries is recorded by the logion " +
                "infrastructure."
        },
        "fr": {
            shortDescription: "USAGE PAR PAYS/REGION",
            description:
                "Suppose que des limitations territoriales s’appliquent. La liste des pays autorisés est enregistrée " +
                "par l’infrastructure Logion. Comprend l’usage sur l’internet, sur les réseaux sociaux, dans tous " +
                "mondes virtuels et dans tous métavers, connus ou inconnus, sauf lorsqu’il s’agit d’un usage personnel " +
                "et privé."
        },
    },
    "NOTIME": {
        "en": {
            shortDescription: "FOR THE ENTIRE DURATION OF THE IP RIGHTS",
            description:
                "The duration of the IP rights contemplated - author rights and copyright - are for the entire life of " +
                "the Creator and 70 years afterward, counted from the moment the work of art has been disclosed."
        },
        "fr": {
            shortDescription: "POUR TOUTE LA DUREE DES DROITS",
            description:
                "La durée des droits de Propriété Intellectuelle – droits d’auteur et copyright – envisagée est pendant " +
                "toute la vie de l’auteur et 70 ans après, décomptée à partir de la date de divulgation de l’œuvre."
        },
    },
    "TIME": {
        "en": {
            shortDescription: "FOR A LIMITED PERIOD OF TIME",
            description:
                "Means that the license/assignment grant is limited in time as recorded by the logion infrastructure"
        },
        "fr": {
            shortDescription: "POUR UNE DUREE DETERMINEE",
            description:
                "Suppose que la licence/cession a une durée limitée, telle qu’enregistrée sur l’infrastructure Logion."
        },
    },
}

export interface LogionLicenseParameters {
    transferredRights: LogionTransferredRightCode[],
    regionalLimit?: Iso3166Alpha2Code[],
    expiration?: string
}

type Condition = (_: LogionLicenseParameters) => boolean;

export class LogionClassification extends AbstractTermsAndConditionsElement<LogionLicenseParameters> {

    constructor(licenseLocId: UUID, parameters: LogionLicenseParameters, checkValidity = true) {
        super('logion_classification', licenseLocId, parameters);
        if (checkValidity) {
            this.checkValidity();
        }
    }

    transferredRights(lang: Language = 'en'): LogionTransferredRight[] {
        return this.parameters.transferredRights.map(code => ({ ...logionLicenseItems[code][lang], code }))
    }

    get regionalLimit(): Iso3166Alpha2Code[] | undefined {
        return this.parameters.regionalLimit
    }

    get expiration(): string | undefined {
        return this.parameters.expiration;
    }

    get details(): string {
        return JSON.stringify(this.parameters)
    }

    checkValidity() {
        const expirationSet: Condition = params => params.expiration !== undefined && params.expiration.length > 0;
        const regionalLimitSet: Condition = params => params.regionalLimit !== undefined && params.regionalLimit.length > 0;
        new Validator(this.parameters)
            .mutuallyExclusive("PER-PRIV", "PER-PUB")
            .mutuallyExclusive("COM-NOMOD", "COM-MOD")
            .mutuallyExclusive("EX", "NOEX")
            .mutuallyExclusive("REG", "WW")
            .mutuallyExclusive("TIME", "NOTIME")
            .codePresentForCondition("TIME", expirationSet, "Transferred right TIME must be set if and only if expiration is set")
            .codePresentForCondition("REG", regionalLimitSet, "Transferred right REG must be set if and only if a regional limit is set")
            .validIsoDate(this.parameters.expiration)
            .validOrThrow()
    }

    static fromDetails(licenseLocId: UUID, details: string, checkValidity = true): LogionClassification {
        const parameters = JSON.parse(details);
        if (parameters.transferredRights === undefined) {
            parameters.transferredRights = [];
        }
        return new LogionClassification(licenseLocId, parameters, checkValidity);
    }
}

class Validator {

    constructor(private parameters: LogionLicenseParameters) {
    }

    private errors: string[] = [];

    validOrThrow() {
        if (this.errors.length > 0) {
            throw new Error(this.errors.join("; "));
        }
    }

    mutuallyExclusive(code1: LogionTransferredRightCode, code2: LogionTransferredRightCode): Validator {
        if (this.parameters.transferredRights.includes(code1) &&
            this.parameters.transferredRights.includes(code2)) {
            this.errors.push(`Transferred rights are mutually exclusive: ${ code1 } and ${ code2 }`);
        }
        return this;
    }

    codePresentForCondition(code: LogionTransferredRightCode, condition: Condition, message: string): Validator {
        if (!this.parameters.transferredRights.includes(code) && condition(this.parameters)) {
            this.errors.push(message);
        }
        if (this.parameters.transferredRights.includes(code) && !condition(this.parameters)) {
            this.errors.push(message);
        }
        return this;
    }

    validIsoDate(date: string | undefined): Validator {
        if (date) {
            if (!DateTime.fromISO(date).isValid) {
                this.errors.push("Invalid date");
            }
        }
        return this;
    }
}