const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const YOULESS_SERVER = process.env.YOULESS_SERVER || 'http://youless';
const { Counter, Gauge, register } = require('prom-client');
const axios = require('axios').default;
const fastify = require('fastify')({
    logger: {
        level: LOG_LEVEL
    }
});

const consumptionTotal = new Counter({
    name: 'youless_kwh_consumption_total',
    help: 'Kwh power consumption.',
    labelNames: ['tariff'],
});

const productionTotal = new Counter({
    name: 'youless_kwh_production_total',
    help: 'Kwh power production.',
    labelNames: ['tariff'],
});

const gasConsumptionTotal = new Counter({
    name: 'youless_gas_consumption_total',
    help: 'Gas consumption.'
});

const currentPowerConsumption = new Gauge({
    name: 'youless_pwr_current',
    help: 'Current watt consumption',
});

fastify.get('/metrics', async () => {
    const youlessEntry = await axios.get(`${YOULESS_SERVER}/e`).then((response) => response.data[0]);
    consumptionTotal.reset();
    consumptionTotal.inc({tariff: 'low'}, youlessEntry.p1);
    consumptionTotal.inc({tariff: 'high'}, youlessEntry.p2);

    productionTotal.reset();
    productionTotal.inc({tariff: 'low'}, youlessEntry.n1);
    productionTotal.inc({tariff: 'high'}, youlessEntry.n2)

    gasConsumptionTotal.reset();
    gasConsumptionTotal.inc(youlessEntry.gas);

    currentPowerConsumption.set(youlessEntry.pwr);

    return register.metrics();
});

const start = async () => {
    try {
        await fastify.listen(9092, '0.0.0.0');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
