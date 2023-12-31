import { UUID } from "@logion/node-api";
import {
    LogionClassification,
    SpecificLicense,
    CreativeCommons,
    MergedTermsAndConditionsElement,
    HashString,
    TermsAndConditionsElement
} from "../../src/index.js";

describe("Factory", () => {

    it("creates a Logion Classification", () => {
        const termsAndConditionsElement = newTermsAndConditionsElement("logion_classification", new UUID(), "{}");
        expect(termsAndConditionsElement).toBeInstanceOf(LogionClassification)
    })

    it("creates a CreativeCommons License", () => {
        const termsAndConditionsElement = newTermsAndConditionsElement("CC4.0", new UUID(), "BY-NC-SA");
        expect(termsAndConditionsElement).toBeInstanceOf(CreativeCommons)
    })

    it("creates a Specific License", () => {
        const termsAndConditionsElement = newTermsAndConditionsElement("specific_license", new UUID(), "");
        expect(termsAndConditionsElement).toBeInstanceOf(SpecificLicense)
    })

    it("fallbacks to Specific License", () => {
        const termsAndConditionsElement = newTermsAndConditionsElement("unknown_license", new UUID(), "some more details");
        expect(termsAndConditionsElement).toBeInstanceOf(SpecificLicense)
    })

})

function newTermsAndConditionsElement(type: string, locId: UUID, details: string): TermsAndConditionsElement {
    return new MergedTermsAndConditionsElement({
        type: HashString.fromValue(type),
        tcLocId: locId,
        details: HashString.fromValue(details),
    }).toTermsAndConditionsElement();
}
