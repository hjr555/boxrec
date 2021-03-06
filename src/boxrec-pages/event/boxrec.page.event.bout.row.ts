import {getColumnData} from "../../helpers";
import {BoxrecCommonTablesClass} from "../boxrec-common-tables/boxrec-common-tables.class";
import {BoxrecBasic, Record, WinLossDraw} from "../boxrec.constants";
import {BoxingBoutOutcome, BoxrecEventLinks} from "./boxrec.event.constants";

const cheerio: CheerioAPI = require("cheerio");
let $: CheerioStatic;

export class BoxrecPageEventBoutRow extends BoxrecCommonTablesClass {

    private _firstBoxer: string;
    private _firstBoxerLast6: string;
    private _firstBoxerRecord: string;
    private _links: string;

    constructor(boxrecBodyBout: string, additionalData: string | null = null) {
        super();
        const html: string = `<table><tr>${boxrecBodyBout}</tr><tr>${additionalData}</tr></table>`;
        $ = cheerio.load(html);

        this.parseBout();
        this.parseMetadata();
    }

    get firstBoxer(): BoxrecBasic {
        return BoxrecCommonTablesClass.parseNameAndId(this._firstBoxer);
    }

    get firstBoxerLast6(): WinLossDraw[] {
        return BoxrecCommonTablesClass.parseLast6Column(this._firstBoxerLast6);
    }

    get firstBoxerRecord(): Record {
        return BoxrecCommonTablesClass.parseRecord(this._firstBoxerRecord);
    }

    // returns an object with keys that contain a class other than `primaryIcon`

    // not the exact same as the other page links
    get links(): BoxrecEventLinks { // object of strings
        const html: Cheerio = $(this._links);
        const obj: BoxrecEventLinks = {
            bio_open: null,
            bout: null,
            other: [], // any other links we'll throw the whole href attribute in here
        };

        html.find("a").each((i: number, elem: CheerioElement) => {
            const div: Cheerio = $(elem).find("div");
            const href: string = $(elem).attr("href");
            const classAttr: string = div.attr("class");
            const hrefArr: string[] = classAttr.split(" ");

            hrefArr.forEach((cls: string) => {
                if (cls !== "primaryIcon") {
                    const matches: RegExpMatchArray | null = href.match(/([\d\/]+)$/);
                    if (matches && matches[1] && matches[1] !== "other") {

                        let formattedCls: string = cls;
                        // for some reason they add a `P` to the end of the class name, we will remove it
                        if (cls.slice(-1) === "P") {
                            formattedCls = cls.slice(0, -1);
                        }

                        if (matches[1].includes("/")) {
                            (obj as any)[formattedCls] = matches[1].substring(1);
                        } else {
                            (obj as any)[formattedCls] = parseInt(matches[1], 10);
                        }

                    } else {
                        (obj as any).other.push(href);
                    }
                }
            });
        });

        return obj;
    }

    get outcomeByWayOf(): BoxingBoutOutcome | string | null {
        const outcome: BoxingBoutOutcome | string | null = this._outcomeByWayOf;
        return BoxrecCommonTablesClass.parseOutcomeByWayOf(outcome);
    }

    private parseBout(): void {
        // if an event has occurred, there are number of different columns
        const numberOfColumns: number = $(`tr:nth-child(1) td`).length;

        if (numberOfColumns === 15) { // event has occurred
            this._division = getColumnData($, 2, false);
            this._firstBoxer = getColumnData($, 3);
            this._firstBoxerWeight = getColumnData($, 4, false);
            this._firstBoxerRecord = getColumnData($, 5);
            this._firstBoxerLast6 = getColumnData($, 6);
            this._outcome = getColumnData($, 7, false);
            this._outcomeByWayOf = getColumnData($, 8);
            this._numberOfRounds = getColumnData($, 9);
            this._secondBoxer = getColumnData($, 10);
            this._secondBoxerWeight = getColumnData($, 11, false);
            this._secondBoxerRecord = getColumnData($, 12);
            this._secondBoxerLast6 = getColumnData($, 13);
            this._rating = getColumnData($, 14);
            this._links = getColumnData($, 15);
        } else if (numberOfColumns === 12) { // event has not occurred
            this._division = getColumnData($, 2, false);
            this._firstBoxer = getColumnData($, 3);
            this._firstBoxerRecord = getColumnData($, 4);
            this._firstBoxerLast6 = getColumnData($, 5);
            this._numberOfRounds = getColumnData($, 7);
            this._secondBoxer = getColumnData($, 8);
            this._secondBoxerRecord = getColumnData($, 9);
            this._secondBoxerLast6 = getColumnData($, 10);
            this._rating = getColumnData($, 11);
            this._links = getColumnData($, 12);
        } else { // if this needs another `else if` statement it is time to break to this up into separate rows
            throw new Error(`different column numbers, please report this with the event id and this number of columns: ${numberOfColumns}`);
        }
    }

    private parseMetadata(): void {
        const el: Cheerio = $(`tr:nth-child(2) td:nth-child(1)`);
        this._metadata = el.html() || "";
    }

}
