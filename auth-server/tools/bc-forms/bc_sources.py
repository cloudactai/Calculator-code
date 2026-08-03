"""BC form source list (Appendix A of BC_MIGRATION_PLAN.md).

docId scheme: Supreme = BCSC_F<num> (dots -> underscores), Provincial = BCPC_<formNo>.
"""

BASE = "https://www2.gov.bc.ca/assets/download/%s?forcedownload=true"

SUPREME = [
    ("F1.1", "Application for divorce (Civil Marriage Act)", "2F3A95A6726440819E4F55FCBD31E1BC"),
    ("F1.2", "Certificate of divorce (Civil Marriage Act)", "C05FD9BC841F44378C027B6375B027FF"),
    ("F3", "Notice of family claim", "67832E5240334B568398C2D18F1D3294"),
    ("F4", "Response to family claim", "A6FB59C023734FF6895E6E1DD08380A2"),
    ("F5", "Counterclaim", "1C31F7BA7F4C495FA6AED315E6BF4D60"),
    ("F6", "Response to counterclaim", "1252594525DB48C9A1F9BACEBE05457F"),
    ("F8", "Financial statement", "EC7998D409A941AC9ACB4D6D6CCFC766"),
    ("F10", "Notice of address for service", "7270FDF4B7484F0F97F0173CA70A0878"),
    ("F17", "Requisition - general", "010D6CEBBDA043AC8DF1DB2A1F30E0F5"),
    ("F19", "Notice of judicial case conference", "4494C36667664CE98C0C7C2BFD5D1612"),
    ("F19.2", "Notice of case planning conference", "93908486CD8E4ED58B35B07C1733C067"),
    ("F20", "List of documents", "19C3E016F52841A29F97E29919A48115"),
    ("F21", "Appointment to examine for discovery", "F99E7FC25B9C488C89EA1EB917AC2398"),
    ("F30", "Affidavit", "1EF0CD0684DD48D988BF687772EC7594"),
    ("F31", "Notice of application", "84E358ACE6DD4C7BA271318147CC7127"),
    ("F32", "Application response", "713888975A004D47BDD953CEE323FABA"),
    ("F33", "Consent order", "C71B81FD54CE42B6A3CA5588DCC74D89"),
    ("F34", "Order made without notice", "96280B7A5D24454D99160265231F092E"),
    ("F38", "Affidavit - desk order divorce", "DDFEF7E3401E40BF9E120E16016192F4"),
    ("F43", "Notice to cross-examine", "2EAD694E823440DB858048999D167CBB"),
    ("F45", "Trial brief", "DEAA044B8ADF465685C0BD8F58863AEC"),
    ("F46", "Trial certificate", "DCE7C39F1DB04D01882AAD3DE9323FDF"),
    ("F51", "Order made after application", "CE912C88855B41EE96FD85AD3F86967E"),
    ("F51.1", "Order made at judicial case conference", "1AA85307E905429F9CA9A4B984A30403"),
    ("F51.2", "Order made at trial management conference", "ECE9AEB5DF7E467497472DCF6B02741D"),
    ("F52", "Final order", "3361E82C80FD44798F2FAEBCABBCE897"),
    ("F55", "Appointment", "5A82EAEFA3114987BD99EE8BCE74BF1B"),
    ("F56", "Certificate of divorce", "6EC65DBC23BB4B3D82FC20376803E43C"),
    ("F75", "Notice of hearing", "F175D2BC3AA74E8DA44DB386869D57FE"),
    ("F89", "Notice of intention to withdraw as lawyer", "DF05A11109AD4483A407CFDCC66BAA5C"),
    ("F91", "Notice of withdrawal of lawyer", "E38702E1BEF44943BD13A3C8CF4C81A3"),
    ("F96", "Electronic filing statement", "33906142FFE741E8983583E23E476295"),
]

PROVINCIAL = [
    ("3", "Application about a family law matter", "PFA712", "30F4D4D7C888474FB8329B7E3B540464"),
    ("4", "Financial statement", "PFA713", "D96BEBD54F904CADBE10ED1AEF648032"),
    ("16", "Application - prohibit relocation of a child", "PFA724", "5209152CDF98406B91ECBAC3B693C4E7"),
    ("17", "Application - family law matter consent order", "PFA723", "EFFC9350754B48DF94261F9DC0770980"),
    ("18", "Consent order", "PFA739", "2CEEC88D8EEE4CBDB1658D1D8B324CF4"),
    ("22", "Trial readiness statement", "PFA735", "39ADC4478A9A4FD4A749A722A4EFB11D"),
    ("42", "Notice of lawyer for party", "PFA760", "E51AC0651AD14F07977E60D16B50A3AE"),
    ("43", "Notice of removal of lawyer for party", "PFA761", "390561F0CA9245989A6FAFF3A5F93397"),
    ("44", "Order - general", "PFA719", "4998E9CDC3F2433BAF1C10E26226DEFE"),
    ("45", "Affidavit - general", "PFA762", "D2722D1915314EE98A9BCC3370C40AFA"),
    ("51", "Electronic filing statement", "PFA768", "7AFADE88746E4C848D572CF369CB0BCE"),
]


def doc_id(court, form_no):
    if court == "Supreme":
        return "BCSC_" + form_no.replace(".", "_")
    return "BCPC_" + form_no.replace(".", "_")


def all_sources():
    out = []
    for form_no, name, guid in SUPREME:
        out.append(dict(docId=doc_id("Supreme", form_no), court="Supreme", formNo=form_no,
                        pfaCode=None, name=name, guid=guid, url=BASE % guid))
    for form_no, name, pfa, guid in PROVINCIAL:
        out.append(dict(docId=doc_id("Provincial", form_no), court="Provincial", formNo=form_no,
                        pfaCode=pfa, name=name, guid=guid, url=BASE % guid))
    return out
