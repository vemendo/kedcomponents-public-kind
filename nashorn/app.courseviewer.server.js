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

/**
 *
 * @param {string} variablePath
 * @param {*} valueToSet
 */
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
/**
 *
 * @param {string} html
 */
function includeHTML(html) {
    out.println(html);
}

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
function includeVendorScripts(libs) {
    var dbg = debug !== 'false' && debug !== '0' && debug !== '';
    libs.forEach(function (lib) {
        includeClientScript(CDN + "/vendor/" + (dbg ? lib.debug || lib.release : lib.release));
        if (lib.css) {
            includeCSS(CDN + "/" + lib.css);
        }
    });
}

// Element Variables:
var NOCSS = scriptVariables.NOCSS;
// Vendor scripts
includeVendorScripts([
    {
        release: 'kedappcourseviewer.min.js',
        debug: 'kedappcourseviewer.js'
    }
]);
var CSS = CDN + "/css";
// Include CSS, HTML and the APP code:
includeOptionalCSS({
    v1: [
        CSS + "/courseviewer.css",
        CSS + "/grid-css-patch.css"
    ],
    versionFolder: CSS + "/delta-css/courseviewer",
    version: 5,
    NOCSS: NOCSS,
    includeCSS: includeCSS,
});
includeHTML("<div class=\"ked-courseviewer\"></div>");
executeClientScript(function () {
    ReactDOM.render(React.createElement(KED.components.KEDAppCourseViewer, {
        courseBuilderUrl: KED.cfg.KED_COURSE_BUILDER_URL // TEMP: Remove when frontend updated to Sprint 2/2019 release.
    }, null), jQuery('div.ked-courseviewer').last()[0]);
}, []);

}());
