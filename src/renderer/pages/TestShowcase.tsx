import { Check } from 'lucide-react';
import { Button, Message, Collapse, Tag } from '@arco-design/web-react';
import React, { useState } from 'react';
import StepsWrapper from '@/renderer/components/base/StepsWrapper';
import ModalWrapper from '@/renderer/components/base/ModalWrapper';

const ComponentsShowcase: React.FC = () => {
  const [message, contextHolder] = Message.useMessage();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className='p-8 space-y-8 max-w-6xl mx-auto'>
      {contextHolder}

      <div>
        <h1 className='text-3xl font-bold mb-2'>Wayland Custom Component Style Showcase</h1>
        <p className='text-t-secondary'>Displays all component styles customized in arco-override.css</p>
      </div>

      {/* Message */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Message - Notification</h2>
        <div className='space-y-3'>
          <Button type='primary' status='success' onClick={() => message.success('Operation successful')} size='large'>
            Success Message
          </Button>
          <Button type='primary' status='warning' onClick={() => message.warning('Warning notification')} size='large'>
            Warning Message
          </Button>
          <Button type='primary' onClick={() => message.info('General notification')} size='large'>
            Info Message
          </Button>
          <Button type='primary' status='danger' onClick={() => message.error('Error notification')} size='large'>
            Error Message
          </Button>
          <Button
            onClick={() => {
              message.success('Operation successful');
              setTimeout(() => message.warning('Warning notification'), 200);
              setTimeout(() => message.info('General notification'), 400);
              setTimeout(() => message.error('Error notification'), 600);
            }}
            size='large'
          >
            Show All Types
          </Button>
        </div>
      </section>

      {/* Button */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Button</h2>
        <div className='flex gap-3'>
          <Button type='outline'>Outline Button</Button>
          <Button type='primary'>Primary Button</Button>
          <Button>Default Button</Button>
          <Button type='primary' shape='round'>
            Round Button
          </Button>
        </div>
      </section>

      {/* Collapse */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Collapse - Accordion Panel</h2>
        <Collapse defaultActiveKey={['1']}>
          <Collapse.Item header='Collapse Panel Title 1' name='1'>
            <div>This is the content area of the collapse panel. Any content can be placed here.</div>
          </Collapse.Item>
          <Collapse.Item header='Collapse Panel Title 2' name='2'>
            <div>Custom styles: no border, border-radius 8px.</div>
          </Collapse.Item>
        </Collapse>
      </section>

      {/* Tag */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Tag - Labels (Dark Mode Optimized)</h2>
        <div className='flex gap-2 flex-wrap'>
          <Tag checkable color='blue'>
            Blue Tag
          </Tag>
          <Tag checkable color='green'>
            Green Tag
          </Tag>
          <Tag checkable color='red'>
            Red Tag
          </Tag>
          <Tag checkable color='orange'>
            Orange Tag
          </Tag>
          <Tag checkable color='gray'>
            Gray Tag
          </Tag>
        </div>
        <p className='text-sm text-t-secondary'>Tip: Switch to dark mode to see the optimized appearance</p>
      </section>

      {/* Steps */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Steps - Step Indicator</h2>
        <StepsWrapper current={currentStep} size='small'>
          <StepsWrapper.Step
            title='Step 1'
            icon={currentStep > 1 ? <Check size={16} color='#165dff' /> : undefined}
          />
          <StepsWrapper.Step
            title='Step 2'
            icon={currentStep > 2 ? <Check size={16} color='#165dff' /> : undefined}
          />
          <StepsWrapper.Step title='Step 3' />
        </StepsWrapper>
        <div className='flex gap-2 mt-4'>
          <Button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>
            Previous
          </Button>
          <Button
            onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
            disabled={currentStep === 3}
            type='primary'
          >
            Next
          </Button>
        </div>
      </section>

      {/* Modal */}
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Modal - Dialog</h2>
        <Button type='primary' onClick={() => setModalVisible(true)}>
          Open Custom Modal
        </Button>
        <ModalWrapper
          title='Custom Modal Title'
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={
            <div className='flex justify-end gap-3'>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type='primary' onClick={() => setModalVisible(false)}>
                Confirm
              </Button>
            </div>
          }
        >
          <div className='p-6'>
            <p>This is a custom modal wrapped using ModalWrapper.</p>
            <p className='mt-2 text-t-secondary'>Features: border-radius 12px, custom close button, theme background color.</p>
          </div>
        </ModalWrapper>
      </section>
    </div>
  );
};

export default ComponentsShowcase;
