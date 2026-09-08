import assert from 'node:assert/strict';
import { isSystemFolder } from './bookmarkManagement';

// 1. Verify Chromium system roots are protected
assert.equal(isSystemFolder('0'), true, 'Chrome root 0 must be system');
assert.equal(isSystemFolder('1'), true, 'Chrome toolbar 1 must be system');
assert.equal(isSystemFolder('2'), true, 'Chrome other 2 must be system');
assert.equal(isSystemFolder('3'), true, 'Chrome mobile 3 must be system');

// 2. Verify Firefox system roots are protected
assert.equal(isSystemFolder('root________'), true, 'Firefox root must be system');
assert.equal(isSystemFolder('menu________'), true, 'Firefox menu must be system');
assert.equal(isSystemFolder('toolbar_____'), true, 'Firefox toolbar must be system');
assert.equal(isSystemFolder('unfiled_____'), true, 'Firefox unfiled must be system');
assert.equal(isSystemFolder('mobile______'), true, 'Firefox mobile must be system');

// 3. Verify normal user folder IDs are NOT considered system
assert.equal(isSystemFolder('4'), false);
assert.equal(isSystemFolder('100'), false);
assert.equal(isSystemFolder('user_folder_1'), false);

console.log('bookmarkManagement system roots self-check OK');
