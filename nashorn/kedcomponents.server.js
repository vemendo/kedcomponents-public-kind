(function () {
'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

var utils = request.getAttribute("sitevision.utils");
var propertyUtil = utils.getPropertyUtil();
var ctxUtil = utils.getPortletContextUtil();
// Get current user
var user = ctxUtil.getCurrentUser();
var groups = [];
try {
    var userGroups = user.getProperty("groups").getValues();
    for (var i = 0; i < userGroups.length; ++i) {
        groups.push('' + userGroups[i]);
    }
}
catch (_) { }
var username = propertyUtil.getString(user, "name", "").toLowerCase();
var mail = propertyUtil.getString(user, "mail", "").toLowerCase();
var displayName = propertyUtil.getString(user, "displayName", "");
var userType = propertyUtil.getString(user, "employeeType", "");
var schoolGrade = propertyUtil.getString(user, "SchoolGrade", "");
var dn = propertyUtil.getString(user, "dn", ""); // CN=Elev Globen,OU=Elever,OU=Globen,OU=Gymnasium,DC=edu,DC=ksab,DC=local
var _a = __read(dn.split(',')
    .map(function (part) { return part.split('='); })
    .filter(function (_a) {
    var _b = __read(_a, 2), key = _b[0], value = _b[1];
    return key.trim().toLowerCase() == 'ou';
})
    .map(function (_a) {
    var _b = __read(_a, 2), key = _b[0], value = _b[1];
    return value.trim();
})
    .reverse(), 3), schoolType = _a[0], school = _a[1], userType2 = _a[2];
var roles = [userType, userType2].filter(function (x) { return x; }); // userType="EMPLOYEE" / "STUDENT", userType2="Medarbetare" / "Elever"
school = school || "KED";
var resultUser = {
    username: username,
    mail: mail,
    displayName: displayName,
    roles: roles,
    groups: groups,
    schoolGrade: parseInt(schoolGrade),
    school: school,
    schoolType: schoolType // "Grundskolor" / "Gymnasium"
};

/**
 *
 * @param {string} variablePath
 * @param {*} valueToSet
 */
function setClientVar(variablePath, valueToSet) {
    out.println('<script>');
    out.println('(' + genVar.toString() + ')(' + JSON.stringify(variablePath) + ')');
    out.println(variablePath + '=' + JSON.stringify(valueToSet) + ';');
    out.println('</script>');
}
/**
 *
 * @param {Function} fn
 * @param {*[]} args
 */
function executeClientScript(fn, args) {
    var argsString = JSON.stringify(args);
    argsString = argsString.substr(1, argsString.length - 2);
    out.println('<script>');
    out.println("(" + fn.toString() + ")(" + (arguments.length > 1 ? argsString : "") + ")");
    out.println('</script>');
}
/** Script to be executed client-side.
 *
 * @param {string} path
 */
function genVar(path) {
    path.split('.').reduce(function (obj, key) { return obj[key] || (obj[key] = {}); }, window);
}
/**
 *
 * @param {string} src
 * @param {*} [bAsync]
 */
function includeClientScript(src, bAsync) {
    out.println("<script" + (bAsync ? " async " : "") + " src=" + JSON.stringify(src) + "></script>");
}
/**
 *
 * @param {string} href
 */
function includeCSS(href) {
    out.println("<link rel=\"stylesheet\" property=\"stylesheet\" type=\"text/css\" media=\"all\" href=" + JSON.stringify(href) + " />");
}
function configure(cfg) {
    executeClientScript(function (cfg) {
        if (typeof KED === 'undefined')
            KED = {};
        if (!KED.cfg)
            KED.cfg = {};
        Object.assign(KED.cfg, cfg); // Was a loo_p before. But must not use fo_r...lo_ops in executeClientScript() because SV will insert a loopP_rotect() code there!
    }, [cfg]);
}

setClientVar("KED.env.currentUser", resultUser);

var schoolLowerCase = resultUser.school.toLowerCase();
var canarySchoolsLowerCase = (scriptVariables.CANARYS_CHOOLS || "")
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .split(',')
    .map(function (school) { return school.trim(); })
    .filter(function (school) { return !!school; });
var useCanary = canarySchoolsLowerCase.some(function (school) { return school === '*' || school === schoolLowerCase; });
// CANARYS_CHOOLS=
// KED,Spanga,Fruangen,Nacka,Uppsala Norra,Vasteras,Ystad,Norrkoping,Borlange,Boras,Tumba,Enkoping,Helsingborg,Jonkoping,Katrineholm,Krokslatt,Landskrona,Lund,Norrkoping,Nykoping,Tyreso,Varberg,Globen,Vasteras
// CANARYS_CHOOLS i feb 2019:
//  KED,standard,Boras,Stockholm,Borlange,Tumba,Enkoping,Enskede,Fruangen,Gavle,Jonkoping,Krokslatt,Nacka,Saltjobaden,Spanga,Vasteras

var KED_TOKEN_PATH = scriptVariables.KED_TOKEN_PATH, KED_TOKEN_PATH_CANARY = scriptVariables.KED_TOKEN_PATH_CANARY, KED_LOCALE = scriptVariables.KED_LOCALE, KED_SCHOOL_LOCALE = scriptVariables.KED_SCHOOL_LOCALE, KED_COURSE_BUILDER_URL = scriptVariables.KED_COURSE_BUILDER_URL, KED_COURSE_VIEWER_URL = scriptVariables.KED_COURSE_VIEWER_URL, KED_SUBJECT_PLANNER_ADMIN_URL = scriptVariables.KED_SUBJECT_PLANNER_ADMIN_URL, KED_SUBJECT_PLANNER_URL = scriptVariables.KED_SUBJECT_PLANNER_URL, KED_FEATURES = scriptVariables.KED_FEATURES, KED_KEEP_ALIVE_URL = scriptVariables.KED_KEEP_ALIVE_URL, KED_ENUM_WORDBANKS_URL = scriptVariables.KED_ENUM_WORDBANKS_URL, KED_WORDBANKS_URL = scriptVariables.KED_WORDBANKS_URL;
configure({
    KED_TOKEN_PATH: useCanary ? KED_TOKEN_PATH_CANARY : KED_TOKEN_PATH,
    KED_LOCALE: KED_LOCALE,
    KED_SCHOOL_LOCALE: KED_SCHOOL_LOCALE,
    KED_COURSE_BUILDER_URL: KED_COURSE_BUILDER_URL,
    KED_COURSE_VIEWER_URL: KED_COURSE_VIEWER_URL,
    KED_SUBJECT_PLANNER_ADMIN_URL: KED_SUBJECT_PLANNER_ADMIN_URL,
    KED_SUBJECT_PLANNER_URL: KED_SUBJECT_PLANNER_URL,
    KED_FEATURES: KED_FEATURES,
    KED_KEEP_ALIVE_URL: KED_KEEP_ALIVE_URL,
    KED_ENUM_WORDBANKS_URL: KED_ENUM_WORDBANKS_URL,
    KED_WORDBANKS_URL: KED_WORDBANKS_URL
});
// temp fix (remove after next client release)
executeClientScript(function (courseViewerUrlKS) {
    window["KED"] = window["KED"] || {};
    window["KED"].env = window["KED"].env || {};
    window["KED"].env.courseViewerUrlKS = courseViewerUrlKS;
}, [KED_SUBJECT_PLANNER_URL]);

var testVersion = request.getParameter("testVersion") ||
    request.getParameter("testversion");
var nextVersion = testVersion === 'next';
var devVersion = testVersion && testVersion.startsWith('dev-') ?
    testVersion.substr('dev-'.length) :
    null;
var KED_CONFIGURED_CDN = scriptVariables.KED_CONFIGURED_CDN;
if (devVersion && !/^[a-z0-9\-]+$/i.test(devVersion)) {
    throw new Error("Invalid dev version. Only alphanumerics and dashes allowed in branch name");
}
var CDN_STABLE_KS = KED_CONFIGURED_CDN || "https://vemendo.github.io/kedcomponents"; // See rollup-replace-env-vars-elements.js
var CDN_STABLE_KG = KED_CONFIGURED_CDN || "https://vemendo.github.io/kedcomponents-public-kg"; // See rollup-replace-env-vars-elements.js
var CDN_CANARY = "https://rawgit.com/vemendo/kedcomponents-public-test/canary"; // See rollup-replace-env-vars-elements.js
var CDN_TEST = "https://rawgit.com/vemendo/kedcomponents-public-test/master"; // See rollup-replace-env-vars-elements.js
var CDN_DEV = "https://rawgit.com/vemendo/kedcomponents-public-test/dev-"; // See rollup-replace-env-vars-elements.js
var CDN_NEXT = "https://rawgit.com/vemendo/kedcomponents-public-test/next"; // See rollup-replace-env-vars-elements.js
var CDN = testVersion ?
    devVersion ?
        CDN_DEV + devVersion : // "dev-<branchname>"
        nextVersion ?
            CDN_NEXT : // Next version - uses alternate database
            CDN_TEST : // test version - azure app connected to production database
    useCanary ?
        CDN_CANARY : // canary version
        request.getServerName().toLowerCase().indexOf("kg") >= 0 ?
            CDN_STABLE_KG : // production KG
            CDN_STABLE_KS; // production KS

function includeOptionalCSS(_a) {
    var v1 = _a.v1, versionFolder = _a.versionFolder, version = _a.version, includeCSS = _a.includeCSS, NOCSS = _a.NOCSS;
    if (!NOCSS) {
        if (v1)
            v1.forEach(function (cssFile) { return includeCSS(cssFile); });
    }
    var cssVer = parseInt(NOCSS);
    if (isNaN(cssVer))
        cssVer = 1;
    for (var ver = cssVer + 1; ver <= version; ++ver) {
        includeCSS(versionFolder + "/v" + ver + ".css");
    }
}

var debug = request.getParameter("debug") || "";
var VendorLibs = {
    React: {
        release: 'react.production.min.js',
        debug: 'react.development.js'
    },
    ReactDom: {
        release: 'react-dom.production.min.js',
        debug: 'react-dom.development.js'
    },
    /*ReactAddonsUpdate: {
      release: 'react-addons-update.min.js'
    },
    ReactRouterDom: {
      release: 'react-router-dom.min.js'
    },
    ReactDatePicker: {
      release: 'reactdatepicker.min.js',
      css: 'css/react-datepicker.css'
    },
    Moment: {
      debug: 'moment.min.js',
      release: 'moment.min.js'
    },*/
    VendorBundle: {
        debug: 'vendors.js',
        release: 'vendors.min.js'
    }
};
function includeVendorScripts(libs) {
    var dbg = debug !== 'false' && debug !== '0' && debug !== '';
    libs.forEach(function (lib) {
        includeClientScript(CDN + "/vendor/" + (dbg ? lib.debug || lib.release : lib.release));
        if (lib.css) {
            includeCSS(CDN + "/" + lib.css);
        }
    });
}

var CSS = CDN + "/css";
var NOCSS = scriptVariables.NOCSS;
// Include CSS, HTML and the APP code:
includeOptionalCSS({
    versionFolder: CSS + "/delta-css/courseviewer",
    version: 7,
    NOCSS: NOCSS,
    includeCSS: includeCSS,
});
// Vendor scripts
includeVendorScripts([
    VendorLibs.React,
    VendorLibs.ReactDom,
    VendorLibs.VendorBundle,
    {
        release: 'kedcomponents.min.js',
        debug: 'kedcomponents.js'
    }
]);

}());
