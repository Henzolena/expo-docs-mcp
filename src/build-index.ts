import { buildIndex } from './utils/indexBuilder';

// Execute the index building process
console.log('Starting index build process...');

buildIndex()
  .then(success => {
    if (success) {
      console.log('Index build completed successfully');
      process.exit(0);
    } else {
      console.error('Index build failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during index build:', error);
    process.exit(1);
  });
