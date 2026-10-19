"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companiesRoutes = companiesRoutes;
const express_1 = require("express");
const companies_1 = require("../repositories/companies");
const validation_1 = require("../utils/validation");
function companiesRoutes(db) {
    const router = (0, express_1.Router)();
    const repo = (0, companies_1.createCompaniesRepo)(db);
    router.get('/', async (req, res, next) => {
        try {
            const filters = (0, validation_1.parseOr400)(validation_1.companyFiltersSchema, req.query);
            const result = await repo.listCompanies(filters);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/:id', async (req, res, next) => {
        try {
            const company = await repo.getCompany(req.params.id);
            if (!company) {
                return void res.status(404).json({ error: { code: 'not_found', message: `Company '${req.params.id}' not found` } });
            }
            res.json(company);
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=companies.js.map