import bcrypt from 'bcrypt';

async function testBcrypt() {
  const password = 'Discord101!';
  const hash = '$2b$10$JKmqRD9DtW1S92WyJQLrreyQganUOZaqbaUtPXf3OePdgUVbRDgTq';
  
  console.log(`Testing bcrypt.compare with password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  try {
    const result = await bcrypt.compare(password, hash);
    console.log(`Result: ${result}`);
  } catch (error) {
    console.error('Error comparing password:', error);
  }
}

testBcrypt();
