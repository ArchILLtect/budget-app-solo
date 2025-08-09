export const originsTestAllEntries = [
    { origin: 'Plaid' },
    { origin: 'CSV' },
    { origin: 'OFX' },
];

export const assessRecurring = (recurring) => {
    console.log(recurring);
    let confirmedCount = 0;
    let possibleCount = 0;
    recurring.forEach((item) => {
        if (item.status === 'confirmed') {
            console.log('Confirmed: ' + item.description);
            confirmedCount++;
        }
    });
    console.log(confirmedCount);
    recurring.forEach((item) => {
        if (item.status === 'possible') {
            console.log('Possible: ' + item.description);
            possibleCount++;
        }
    });
    console.log(possibleCount);
    const entriesMissing = recurring.length - confirmedCount - possibleCount;
    console.log(entriesMissing + ' entries unaccounted for');
};
