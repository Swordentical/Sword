import { getUncachableStripeClient } from './stripeClient';

async function createSubscriptionProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating subscription products in Stripe...');

  const existingProducts = await stripe.products.list({ limit: 100 });
  const existingNames = existingProducts.data.map(p => p.name);

  if (!existingNames.includes('Student Plan')) {
    const studentProduct = await stripe.products.create({
      name: 'Student Plan',
      description: 'Perfect for dental students - manage up to 50 patients with essential features',
      metadata: {
        type: 'student',
        patientLimit: '50',
        userLimit: '1',
      },
    });

    await stripe.prices.create({
      product: studentProduct.id,
      unit_amount: 100,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { billing: 'yearly' },
    });

    console.log('Created Student Plan:', studentProduct.id);
  } else {
    console.log('Student Plan already exists');
  }

  if (!existingNames.includes('Doctor Plan')) {
    const doctorProduct = await stripe.products.create({
      name: 'Doctor Plan',
      description: 'For individual practitioners - manage up to 200 patients with expanded features',
      metadata: {
        type: 'doctor',
        patientLimit: '200',
        userLimit: '2',
      },
    });

    await stripe.prices.create({
      product: doctorProduct.id,
      unit_amount: 500,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { billing: 'monthly' },
    });

    await stripe.prices.create({
      product: doctorProduct.id,
      unit_amount: 5000,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { billing: 'yearly' },
    });

    console.log('Created Doctor Plan:', doctorProduct.id);
  } else {
    console.log('Doctor Plan already exists');
  }

  if (!existingNames.includes('Clinic Plan')) {
    const clinicProduct = await stripe.products.create({
      name: 'Clinic Plan',
      description: 'Full-featured solution for dental clinics - unlimited patients and users with all features',
      metadata: {
        type: 'clinic',
        patientLimit: 'unlimited',
        userLimit: 'unlimited',
        trialDays: '15',
      },
    });

    await stripe.prices.create({
      product: clinicProduct.id,
      unit_amount: 15000,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { billing: 'yearly' },
    });

    console.log('Created Clinic Plan:', clinicProduct.id);
  } else {
    console.log('Clinic Plan already exists');
  }

  console.log('Subscription products created successfully!');
}

createSubscriptionProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error creating products:', err);
    process.exit(1);
  });
